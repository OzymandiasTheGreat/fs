const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const https = require("https");
const { exec } = require("child_process");
const meow = require("meow");
const tar = require("tar-fs");
const gz = require("gunzip-maybe");

async function download(uri) {
	return new Promise((resolve, reject) =>
		https.get(uri, (response) => {
			switch (response.statusCode) {
				case 200:
					resolve(response);
					break;
				case 302:
					download(response.headers.location)
						.then(resolve)
						.catch(reject);
					break;
				default:
					reject(response.statusCode);
			}
		}),
	);
}

async function downloadBoost() {
	const RNDIR = require.resolve("react-native/package.json");
	const PROPERTIES_FILE = path.join(
		path.dirname(RNDIR),
		"ReactAndroid/gradle.properties",
	);
	const PROPERTIES = await fsp.readFile(PROPERTIES_FILE, "utf8");
	const BOOST_VERSION = [
		...PROPERTIES.matchAll(/BOOST_VERSION=([\d_]+)/g),
	][0][1];
	const BOOST_VERSION_DOTS = BOOST_VERSION.replaceAll("_", ".");
	const BOOST_FILENAME = `boost_${BOOST_VERSION}.tar.gz`;
	const BOOST_URI = `https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION_DOTS}/source/${BOOST_FILENAME}`;
	if (
		await fsp
			.access(BOOST_FILENAME)
			.then(() => true)
			.catch(() => false)
	) {
		const size = (await fsp.stat(BOOST_FILENAME)).size;
		if (size > 130000000) {
			console.log(`Found Boost at ${path.resolve(BOOST_FILENAME)}`);
			return path.resolve(BOOST_FILENAME);
		}
	}
	console.log("Downloading Boost from ", BOOST_URI);
	const response = await download(BOOST_URI).catch((err) =>
		console.log("Download failed with status code ", err),
	);
	if (response) {
		const stream = fs.createWriteStream(BOOST_FILENAME);
		response.pipe(stream);
		await new Promise((resolve) =>
			stream.on("finish", () => stream.close(resolve)),
		);

		return path.resolve(BOOST_FILENAME);
	}

	console.log("Failed to download Boost");
	return null;
}

async function extractBoost(uri) {
	const TAR_NAME = path.basename(uri, path.extname(uri));
	const BASENAME = path.basename(TAR_NAME, path.extname(TAR_NAME));
	const BASEDIR = path.resolve(path.dirname(uri), BASENAME);
	const BOOST_DIR = path.resolve(__dirname, "../Boost");
	if (
		await fsp
			.access(BOOST_DIR)
			.then(() => true)
			.catch(() => false)
	) {
		return BOOST_DIR;
	}
	await new Promise((resolve, reject) => {
		const stream = tar.extract(path.dirname(BASEDIR));
		stream.on("finish", resolve);
		stream.on("error", reject);
		fs.createReadStream(uri).pipe(gz()).pipe(stream);
	});
	await fsp.rename(BASEDIR, BOOST_DIR);
	return BOOST_DIR;
}

async function writeUserConfigJam() {
	const ANDROID_NDK_HOME = process.env.ANDROID_NDK_HOME;
	if (!ANDROID_NDK_HOME) {
		return console.error("$ANDROID_NDK_HOME not set!");
	}
	const content = `using clang : arm64 : ${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android30-clang++ : <cxxflags>-std=c++17 ;
using clang : arm : ${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/armv7a-linux-androideabi30-clang++ : <cxxflags>-std=c++17 ;
using clang : x86 : ${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/i686-linux-android30-clang++ : <cxxflags>-std=c++17 ;
using clang : x86_64 : ${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android30-clang++ : <cxxflags>-std=c++17 ;
`;
	await fsp.writeFile(
		path.resolve(process.env.HOME, "user-config.jam"),
		content,
		"utf8",
	);
}

async function bootstrap(boostdir, libraries) {
	const bs = exec(
		`${path.join(boostdir, "bootstrap.sh")} --prefix=${path.join(
			boostdir,
			"android",
		)} --with-libraries=${libraries?.join(",") || "all"}`,
		{ cwd: boostdir },
	);
	bs.stdout.pipe(process.stdout);
	bs.stderr.pipe(process.stderr);
	return new Promise((resolve, reject) => {
		bs.on("error", reject);
		bs.on("close", resolve);
	});
}

async function patch(boostdir) {
	const needle = `        if $(type) = SHARED_LIB &&\n          ! [ $(property-set).get <target-os> ] in windows cygwin darwin aix &&\n          ! [ $(property-set).get <toolset> ] in pgi\n        {\n            result = $(result).$(BOOST_VERSION)  ;\n        }\n\n        return $(result) ;\n    }`;
	const replacement = `        if $(type) = SHARED_LIB &&\n          ! [ $(property-set).get <target-os> ] in windows cygwin darwin aix &&\n          ! [ $(property-set).get <toolset> ] in pgi\n        {\n            result = $(result)  ;\n        }\n\n        return $(result) ;\n    }`;
	const filepath = path.join(boostdir, "boostcpp.jam");
	const content = await fsp.readFile(filepath, "utf8");
	const replaced = content.replace(needle, replacement);
	await fsp.writeFile(filepath, replaced, "utf8");
}

async function build(boostdir) {
	const configs = [
		{
			toolset: "clang-arm",
			prefix: path.join(boostdir, "android/armeabi-v7a"),
		},
		{
			toolset: "clang-arm64",
			prefix: path.join(boostdir, "android/arm64-v8a"),
		},
		{
			toolset: "clang-x86_64",
			prefix: path.join(boostdir, "android/x86_64"),
		},
		{
			toolset: "clang-x86",
			prefix: path.join(boostdir, "android/x86"),
		},
	];
	for (const config of configs) {
			const res = await new Promise((resolve, reject) => {
				const b2 = exec(
					`${path.join(boostdir, "b2")} toolset=${
						config.toolset
					} target-os=android link=shared variant=release threading=multi --layout=system --prefix=${
						config.prefix
					} -s NO_LZMA=1 -s NO_BZIP2=1 install`,
					{ cwd: boostdir },
				);
				b2.on("error", reject);
				b2.on("close", resolve);
				b2.stdout.pipe(process.stdout);
				b2.stderr.pipe(process.stderr);
			});
			if (res !== 0) {
				process.exit(res);
				break;
			}
	}
	return 0;
}

const cli = meow(
	`
	Download and setup Boost for react-native development

	Usage:
		node booststrap [-b library]

	Options
		--boost-library, -b Library to build. Can be specified multiple times
	`,
	{
		flags: {
			boostLibrary: {
				type: "string",
				alias: "b",
				isMultiple: true,
			},
		},
	},
);

downloadBoost()
	.then((uri) => {
		if (!uri) {
			return console.error("Failed to download Boost");
		}
		return extractBoost(uri);
	})
	.then(async (boostdir) => {
		writeUserConfigJam();
		const exitCode = await bootstrap(boostdir, cli.flags.boostLibrary);
		console.log("b2 build finished with ", exitCode);
		console.log("Patching Boost scripts...");
		await patch(boostdir).then(() => console.log("Patched!"));
		const buildCode = await build(boostdir);
		console.log(
			"Android compilation finished with exit code ",
			buildCode,
		);
	});
