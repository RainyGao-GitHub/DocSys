/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

module.exports = function(grunt) {
	function loadConfig(pathConfigs, name) {
		let config;
		try {
			const file = path.join(pathConfigs, name + '.json');
			if (grunt.file.exists(file)) {
				config = grunt.file.readJSON(file);
				grunt.log.ok((name + ' config loaded successfully').green);
			}
		} catch (e) {
			grunt.log.error().writeln(('could not load' + name + 'config file').red);
		}
		return config;
	}
	function fixPath(obj, basePath = '') {
		function fixPathArray(arrPaths, basePath = '') {
			arrPaths.forEach((element, index) => {
				arrPaths[index] = path.join(basePath, element);
			});
		}
		if (Array.isArray(obj))
			return fixPathArray(obj, basePath);
		for (let prop in obj) {
			fixPath(obj[prop], basePath);
		}
	}
	function fixUrl(arrPaths, basePath = '') {
		const url = require('url');
		arrPaths.forEach((element, index) => {
			arrPaths[index] = url.resolve(basePath, element);
		});
	}
	function getConfigs() {
		const configs = new CConfig(grunt.option('src') || '../');

		let addons = grunt.option('addon') || [];
		if (!Array.isArray(addons)) {
			addons = [addons];
		}
		addons.forEach(element => configs.append(grunt.file.isDir(element) ? element : path.join('../../', element)));

		return configs;
	}
	function writeScripts(config, name) {
		const develop = '../develop/sdkjs/';
		const fileName = 'scripts.js';
		const files = ['../common/applyDocumentChanges.js', '../common/AllFonts.js'].concat(getFilesMin(config), getFilesAll(config));
		fixUrl(files, '../../../../sdkjs/build/');

		grunt.file.write(path.join(develop, name, fileName), 'var sdk_scripts = [\n\t"' + files.join('",\n\t"') + '"\n];');
	}

	function CConfig(pathConfigs) {
		this.fonts = null;
		this.externs = null;
		this.word = null;
		this.cell = null;
		this.slide = null;

		this.append(pathConfigs);
	}

	CConfig.prototype.append = function (basePath = '') {
		const pathConfigs = path.join(basePath, 'configs');
		
		function appendOption(name) {
			const option = loadConfig(pathConfigs, name);
			if (!option)
				return;
			
			fixPath(option, basePath);
			
			if (!this[name]) {
				this[name] = option;
				return;
			}
			
			function mergeProps(base, addon) {
				for (let prop in addon)
				{
					if (Array.isArray(addon[prop])) {
						base[prop] = Array.isArray(base[prop]) ? base[prop].concat(addon[prop]) : addon[prop];
					} else {
						if (!base[prop]) 
							base[prop] = {};
						mergeProps(base[prop], addon[prop]);						
					}
				}
			}
			
			mergeProps(this[name], option);			
		}
		
		appendOption.call(this, 'fonts');
		appendOption.call(this, 'externs');
		appendOption.call(this, 'word');
		appendOption.call(this, 'cell');
		appendOption.call(this, 'slide');
	};
	CConfig.prototype.valid = function () {
		return this.fonts && this.externs && this.word && this.cell && this.slide;
	};

	function getExterns(config) {
		var externs = config['externs'];
		var result = [];
		for (var i = 0; i < externs.length; ++i) {
			result.push('--externs=' + externs[i]);
		}
		return result;
	}
	function getFilesMin(config) {
		var result = config['min'];
		if (grunt.option('mobile')) {
			result = config['mobile_banners']['min'].concat(result);
		}
		if (grunt.option('desktop')) {
			result = result.concat(config['desktop']['min']);
		}
		return result;
	}
	function getFilesAll(config) {
		var result = config['common'];
		if (grunt.option('mobile')) {
			result = config['mobile_banners']['common'].concat(result);

			var excludeFiles = config['exclude_mobile'];
			result = result.filter(function(item) {
				return -1 === excludeFiles.indexOf(item);
			});
			result = result.concat(config['mobile']);
		}
		if (grunt.option('desktop')) {
			result = result.concat(config['desktop']['common']);
		}
		return result;
	}
	function getSdkPath(min, name) {
		return path.join(name, min ? 'sdk-all-min.js' : 'sdk-all.js');
	}

	const path = require('path');
	const level = grunt.option('level') || 'ADVANCED';
	const formatting = grunt.option('formatting') || '';

	require('google-closure-compiler').grunt(grunt, {
		platform: 'java',
		extraArguments: ['-Xms2048m']
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-split-file');

	grunt.registerTask('build-sdk', 'Build SDK', function () {
		const configs = getConfigs();
		if (!configs.valid()) {
			return;
		}

		const configWord = configs.word['sdk'];
		const configCell = configs.cell['sdk'];
		const configSlide = configs.slide['sdk'];

		const deploy = '../deploy/sdkjs/';

		// crete empty.js for polyfills
		const emptyJs = 'empty.js';
		grunt.file.write(emptyJs, '');

		const optionsSdkMin ={
			banner: '',
			footer: 'window["split"]="split";'
		};
		const optionsSdkAll = {
			banner: '(function(window, undefined) {',
			footer: '})(window);'
		};
		const fontsWasmTmp = 'fonts-wasm-tmp.js';
		const fontsJsTmp = 'fonts-js-tmp.js';
		const sdkMinTmp = 'sdk-min-tmp.js';
		const sdkAllTmp = 'sdk-all-tmp.js';
		const sdkWordTmp = 'sdk-word-tmp.js';
		const sdkCellTmp = 'sdk-cell-tmp.js';
		const sdkSlideTmp = 'sdk-slide-tmp.js';

		const compilerArgs = getExterns(configs.externs);
		if (grunt.option('map')) {
			compilerArgs.push('--property_renaming_report=sdk-all.props.js.map');
			compilerArgs.push('--variable_renaming_report=sdk-all.vars.js.map');
		}
		if (formatting) {
			compilerArgs.push('--formatting=' + formatting);
		}

		grunt.initConfig({
			concat: {
				wasm: {
					src: configs.fonts['wasm'],
					dest: fontsWasmTmp
				},
				js: {
					src: configs.fonts['js'],
					dest: fontsJsTmp
				},
				wordsdkmin: {
					options: optionsSdkMin,
					src: getFilesMin(configWord),
					dest: sdkMinTmp
				},
				wordsdkall: {
					options: optionsSdkAll,
					src: getFilesAll(configWord),
					dest: sdkAllTmp
				},
				wordall: {
					src: [sdkMinTmp, sdkAllTmp],
					dest: sdkWordTmp
				},
				cellsdkmin: {
					options: optionsSdkMin,
					src: getFilesMin(configCell),
					dest: sdkMinTmp
				},
				cellsdkall: {
					options: optionsSdkAll,
					src: getFilesAll(configCell),
					dest: sdkAllTmp
				},
				cellall: {
					src: [sdkMinTmp, sdkAllTmp],
					dest: sdkCellTmp
				},
				slidesdkmin: {
					options: optionsSdkMin,
					src: getFilesMin(configSlide),
					dest: sdkMinTmp
				},
				slidesdkall: {
					options: optionsSdkAll,
					src: getFilesAll(configSlide),
					dest: sdkAllTmp
				},
				slideall: {
					src: [sdkMinTmp, sdkAllTmp],
					dest: sdkSlideTmp
				}
			},
			'closure-compiler': {
				js: {
					options: {
						args: compilerArgs.concat(
							'--rewrite_polyfills=true', '--jscomp_off=checkVars',
							'--warning_level=QUIET', '--compilation_level=' + level,
							'--module=polyfill:1:', '--js=' + emptyJs,
							'--module=fontswasm:1:polyfill', '--js=' + fontsWasmTmp,
							'--module=fontsjs:1:fontswasm', '--js=' + fontsJsTmp,
							'--module=word:1:fontswasm', '--js=' + sdkWordTmp,
							'--module=cell:1:fontswasm', '--js=' + sdkCellTmp,
							'--module=slide:1:fontswasm', '--js=' + sdkSlideTmp)
					}
				}
			},
			clean: {
				tmp: {
					options: {
						force: true
					},
					src: [
						emptyJs,
						fontsWasmTmp,
						fontsJsTmp,
						sdkMinTmp,
						sdkAllTmp,
						sdkWordTmp,
						sdkCellTmp,
						sdkSlideTmp,
						deploy
					]
				}
			}
		});
	});
	grunt.registerTask('license', 'Add license', function () {
		const appCopyright = "Copyright (C) Ascensio System SIA 2012-" + grunt.template.today('yyyy') +". All rights reserved";
		const publisherUrl = "https://www.onlyoffice.com/";
		const fonts = '../common/libfont/';
		const deploy = '../deploy/sdkjs/';
		const word = path.join(deploy, 'word');
		const cell = path.join(deploy, 'cell');
		const slide = path.join(deploy, 'slide');
		const polyfill = 'polyfill.js';
		const fontsWasm = 'fontswasm.js';
		const fontsJs = 'fontsjs.js';
		const fontFile = 'fonts.js';
		const wordJs = 'word.js';
		const cellJs = 'cell.js';
		const slideJs = 'slide.js';
		const license = 'license.header';
		let splitLine;
		if ('ADVANCED' === level) {
			splitLine = ('PRETTY_PRINT' === formatting) ? 'window.split = "split";' : 'window.split="split";';
		} else {
			splitLine = ('PRETTY_PRINT' === formatting) ? 'window["split"] = "split";' : 'window["split"]="split";';
		}
		const splitOptions = {
			separator: splitLine,
			prefix: ["sdk-all-min", "sdk-all"]
		};

		const concatSdk = {files:{}};
		const concatSdkFiles = concatSdk['files'];
		concatSdkFiles[fontsWasm] = [license, fontsWasm];
		concatSdkFiles[fontsJs] = [license, fontsJs];
		concatSdkFiles[getSdkPath(true, word)] = [license, polyfill, getSdkPath(true, word)];
		concatSdkFiles[getSdkPath(false, word)] = [license, getSdkPath(false, word)];
		concatSdkFiles[getSdkPath(true, cell)] = [license, polyfill, getSdkPath(true, cell)];
		concatSdkFiles[getSdkPath(false, cell)] = [license, getSdkPath(false, cell)];
		concatSdkFiles[getSdkPath(true, slide)] = [license, polyfill, getSdkPath(true, slide)];
		concatSdkFiles[getSdkPath(false, slide)] = [license, getSdkPath(false, slide)];

		grunt.initConfig({
			splitfile: {
				word: {
					options: splitOptions,
					dest: word,
					src: wordJs
				},
				cell: {
					options: splitOptions,
					dest: cell,
					src: cellJs
				},
				slide: {
					options: splitOptions,
					dest: slide,
					src: slideJs
				}
			},
			concat: {
				sdk: concatSdk
			},
			replace: {
				version: {
					options: {
						patterns: [
							{
								json: {
									AppCopyright: process.env['APP_COPYRIGHT'] || appCopyright,
									PublisherUrl: process.env['PUBLISHER_URL'] || publisherUrl,
									Version: process.env['PRODUCT_VERSION'] || '0.0.0',
									Build: process.env['BUILD_NUMBER'] || '0'
								}
							}
						]
					},
					files: [
						{src: [fontsWasm], dest: path.join(fonts, 'wasm', fontFile)},
						{src: [fontsJs], dest: path.join(fonts, 'js', fontFile)},
						{expand: true, flatten: true, src: [getSdkPath(true, word), getSdkPath(false, word)], dest: word + '/'},
						{expand: true, flatten: true, src: [getSdkPath(true, cell), getSdkPath(false, cell)], dest: cell + '/'},
						{expand: true, flatten: true, src: [getSdkPath(true, slide), getSdkPath(false, slide)], dest: slide + '/'}
					]
				}
			},
			clean: {
				tmp: {
					options: {
						force: true
					},
					src: [
						polyfill,
						fontsWasm,
						fontsJs,
						wordJs,
						cellJs,
						slideJs
					]
				}
			},
			copy: {
				sdkjs: {
					files: [
						{
							expand: true,
							cwd: '../common/',
							src: [
								'Images/*',
								'Images/placeholders/*',
								'Images/content_controls/*',
								'Images/cursors/*',
								'Native/*.js',
								'libfont/js/fonts.*',
								'libfont/wasm/fonts.*'
							],
							dest: path.join(deploy, 'common')
						},
						{
							expand: true,
							cwd: '../cell/css',
							src: '*.css',
							dest: path.join(cell, 'css')
						},
						{
							expand: true,
							cwd: '../slide/themes',
							src: '**/**',
							dest: path.join(slide, 'themes')
						}
					]
				}
			}
		})
	});
	grunt.registerTask('clean-develop', 'Clean develop scripts', function () {
		const develop = '../develop/sdkjs/';
		grunt.initConfig({
			clean: {
				tmp: {
					options: {
						force: true
					}, src: [develop]
				}
			}
		});
	});
	grunt.registerTask('build-develop', 'Build develop scripts', function () {
		const configs = getConfigs();
		if (!configs.valid()) {
			return;
		}

		writeScripts(configs.word['sdk'], 'word');
		writeScripts(configs.cell['sdk'], 'cell');
		writeScripts(configs.slide['sdk'], 'slide');
	});
	grunt.registerTask('default', ['build-sdk', 'concat', 'closure-compiler', 'clean', 'license', 'splitfile', 'concat', 'replace', 'clean', 'copy']);
	grunt.registerTask('develop', ['clean-develop', 'clean', 'build-develop']);
};
