# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.10.5](https://github.com/MapColonies/mapproxy-api/compare/v1.10.4...v1.10.5) (2025-02-24)


### Bug Fixes

* removing max_old_space_size from Dockerfile ([#137](https://github.com/MapColonies/mapproxy-api/issues/137)) ([ed1d6f9](https://github.com/MapColonies/mapproxy-api/commit/ed1d6f912ef125dc0312520493255c148aab2dda))

### [1.10.4](https://github.com/MapColonies/mapproxy-api/compare/v1.10.3...v1.10.4) (2025-02-10)


### Bug Fixes

* add s3 config to globals ([#134](https://github.com/MapColonies/mapproxy-api/issues/134)) ([a29db8c](https://github.com/MapColonies/mapproxy-api/commit/a29db8c2140a2ec8cc6c1b75fa30c1507a4f23f2))
* **mapproxy_init.json:** add globals.image.paletted: false ([#136](https://github.com/MapColonies/mapproxy-api/issues/136)) ([00f844a](https://github.com/MapColonies/mapproxy-api/commit/00f844a93a2a08edf83b84b543cf4db2ec1ab11f))

### [1.10.3](https://github.com/MapColonies/mapproxy-api/compare/v1.10.2...v1.10.3) (2024-05-08)


### Bug Fixes

* add managed init mapproxy.json + insert script ([#133](https://github.com/MapColonies/mapproxy-api/issues/133)) ([0572953](https://github.com/MapColonies/mapproxy-api/commit/05729532ce998c7e718289811f6c14e0a30aba86))

### [1.10.2](https://github.com/MapColonies/mapproxy-api/compare/v1.10.1...v1.10.2) (2024-03-07)

### [1.10.1](https://github.com/MapColonies/mapproxy-api/compare/v1.10.0...v1.10.1) (2024-03-07)


### Bug Fixes

* make redis yaml values supported on global scope ([4bbb0c6](https://github.com/MapColonies/mapproxy-api/commit/4bbb0c60c1588b4112f43b21ab9e8f7a21f4a192))
* support global scope for redis values ([#132](https://github.com/MapColonies/mapproxy-api/issues/132)) ([af0a07d](https://github.com/MapColonies/mapproxy-api/commit/af0a07da395b7aa60360e5f5a7a779a2b4ca484a))

## [1.10.0](https://github.com/MapColonies/mapproxy-api/compare/v1.9.0...v1.10.0) (2024-02-29)


### Features

* Grid validation on insert and update (MAPCO-3975) ([#129](https://github.com/MapColonies/mapproxy-api/issues/129)) ([8d42164](https://github.com/MapColonies/mapproxy-api/commit/8d4216481fd3d2a07f974ad3a24d5c00093589a1))
* update redis to new design (MAPCO-3769) ([#131](https://github.com/MapColonies/mapproxy-api/issues/131)) ([7013deb](https://github.com/MapColonies/mapproxy-api/commit/7013debd07c433e09457a3c1b2b0118272dcd51c))


### Bug Fixes

*  helm booleans to strings ([34da563](https://github.com/MapColonies/mapproxy-api/commit/34da563a7dd4c6e9ead6062e0007a00d2a314f06))

## [1.9.0](https://github.com/MapColonies/mapproxy-api/compare/v1.8.2...v1.9.0) (2024-02-28)


### Features

* add tracing (MAPCO-3914) ([#127](https://github.com/MapColonies/mapproxy-api/issues/127)) ([ea566bd](https://github.com/MapColonies/mapproxy-api/commit/ea566bdf9aff3e0235d5327bba58f6951c66dd1f))

### [1.8.2](https://github.com/MapColonies/mapproxy-api/compare/v1.8.1...v1.8.2) (2024-02-20)

### [1.8.1](https://github.com/MapColonies/mapproxy-api/compare/v1.8.0...v1.8.1) (2024-02-20)


### Bug Fixes

* support helm registry auto pushing ([#124](https://github.com/MapColonies/mapproxy-api/issues/124)) ([868f2cf](https://github.com/MapColonies/mapproxy-api/commit/868f2cf1d7cc420f50bb972dc1ce405edab746cb))

## [1.8.0](https://github.com/MapColonies/mapproxy-api/compare/v1.7.6...v1.8.0) (2024-02-20)


### Features

*  adding mimeType image format manipulate ([#120](https://github.com/MapColonies/mapproxy-api/issues/120)) ([9eb6b2f](https://github.com/MapColonies/mapproxy-api/commit/9eb6b2f144588e48920bb7c21af78d4a4884df91))

### [1.7.6](https://github.com/MapColonies/mapproxy-api/compare/v1.7.5...v1.7.6) (2024-02-20)


### Bug Fixes

* chart configmap condition + default values ([#123](https://github.com/MapColonies/mapproxy-api/issues/123)) ([3f48416](https://github.com/MapColonies/mapproxy-api/commit/3f4841658cd615b2992aeb3652074d56d2b3251f))

### [1.7.5](https://github.com/MapColonies/mapproxy-api/compare/v1.7.4...v1.7.5) (2024-02-20)


### Bug Fixes

* layer name (MAPCO-4005) ([#122](https://github.com/MapColonies/mapproxy-api/issues/122)) ([ba8221e](https://github.com/MapColonies/mapproxy-api/commit/ba8221e1fc1e4a931605874914074b794fceeb80))

### [1.7.4](https://github.com/MapColonies/mapproxy-api/compare/v1.7.3...v1.7.4) (2024-02-19)


### Bug Fixes

* internal mount dir for fs storage ([#121](https://github.com/MapColonies/mapproxy-api/issues/121)) ([5c1775a](https://github.com/MapColonies/mapproxy-api/commit/5c1775a71337c7bed0d58aea372881227adc63bd))

### [1.7.3](https://github.com/MapColonies/mapproxy-api/compare/v1.7.2...v1.7.3) (2024-02-12)


### Bug Fixes

* fix config scope ([#118](https://github.com/MapColonies/mapproxy-api/issues/118)) ([28827cb](https://github.com/MapColonies/mapproxy-api/commit/28827cbb811cbbd5f3eace71f6fff025c54dffd1))

### [1.7.2](https://github.com/MapColonies/mapproxy-api/compare/v1.7.1...v1.7.2) (2024-02-12)

### [1.7.1](https://github.com/MapColonies/mapproxy-api/compare/v1.7.0...v1.7.1) (2024-02-12)


### Bug Fixes

* redis enabled config ([#117](https://github.com/MapColonies/mapproxy-api/issues/117)) ([fb2b971](https://github.com/MapColonies/mapproxy-api/commit/fb2b9718b4c4ecf2dde71535241581afd9f6a26c))

## [1.7.0](https://github.com/MapColonies/mapproxy-api/compare/v1.6.0...v1.7.0) (2024-02-06)


### Features

* enable redis layers automatic addition to config ([#107](https://github.com/MapColonies/mapproxy-api/issues/107)) ([ae8a138](https://github.com/MapColonies/mapproxy-api/commit/ae8a138f5f97e44595348ede9afb6fb0da2a9590))


### Bug Fixes

* remove duplicate values ([#112](https://github.com/MapColonies/mapproxy-api/issues/112)) ([e0b779c](https://github.com/MapColonies/mapproxy-api/commit/e0b779c38b0ce3e79abfe8037ee998a1ec94b8c2))

## [1.6.0](https://github.com/MapColonies/mapproxy-api/compare/v1.5.4...v1.6.0) (2024-01-15)


### Features

* adding api retrieve current mapproxy yaml configuration ([#111](https://github.com/MapColonies/mapproxy-api/issues/111)) ([fe02193](https://github.com/MapColonies/mapproxy-api/commit/fe021931d8bdba7c08bb29a978310cb4efaad00f))

### [1.5.4](https://github.com/MapColonies/mapproxy-api/compare/v1.5.3...v1.5.4) (2023-12-26)

### [1.5.3](https://github.com/MapColonies/mapproxy-api/compare/v1.5.2...v1.5.3) (2023-05-24)


### Bug Fixes

* changes github pr flow node version to new one ([df1c79e](https://github.com/MapColonies/mapproxy-api/commit/df1c79e01f46bc31b25c40386c2c98815fb9b900))

### [1.5.2](https://github.com/MapColonies/mapproxy-api/compare/v1.5.1...v1.5.2) (2023-04-20)

### [1.5.1](https://github.com/MapColonies/mapproxy-api/compare/v1.5.0...v1.5.1) (2023-04-20)


### Bug Fixes

* chart ([#101](https://github.com/MapColonies/mapproxy-api/issues/101)) ([df51ed7](https://github.com/MapColonies/mapproxy-api/commit/df51ed725f81b5cd82eb2f1d0d75faed66e95f1e))

## [1.5.0](https://github.com/MapColonies/mapproxy-api/compare/v1.4.11...v1.5.0) (2023-01-08)


### Features

* adding layer cache param of "minimize_meta_request=true" ([#99](https://github.com/MapColonies/mapproxy-api/issues/99)) ([c66ed60](https://github.com/MapColonies/mapproxy-api/commit/c66ed6018ee2fab26a4943bbeb2decd29d4086fb))

### [1.4.11](https://github.com/MapColonies/mapproxy-api/compare/v1.4.10...v1.4.11) (2022-12-27)

### [1.4.10](https://github.com/MapColonies/mapproxy-api/compare/v1.4.9...v1.4.10) (2022-09-08)

### [1.4.9](https://github.com/MapColonies/mapproxy-api/compare/v1.4.8...v1.4.9) (2022-07-18)


### Bug Fixes

* db provider atomic updates ([#94](https://github.com/MapColonies/mapproxy-api/issues/94)) ([20f397e](https://github.com/MapColonies/mapproxy-api/commit/20f397e5a6037d61a6b6071de9f56c3d7c3d577d))
* node extra certs value ([#93](https://github.com/MapColonies/mapproxy-api/issues/93)) ([87bda70](https://github.com/MapColonies/mapproxy-api/commit/87bda706d7abbf63430fef76cc7dd5b9d897b21f))

### [1.4.8](https://github.com/MapColonies/mapproxy-api/compare/v1.4.7...v1.4.8) (2022-06-27)

### [1.4.7](https://github.com/MapColonies/mapproxy-api/compare/v1.4.6...v1.4.7) (2022-06-27)


### Bug Fixes

* remove maxZoom param ([#92](https://github.com/MapColonies/mapproxy-api/issues/92)) ([70774a0](https://github.com/MapColonies/mapproxy-api/commit/70774a0f1c9314165b6921753eb2b47f6253e8f0))
* run audit fix ([#91](https://github.com/MapColonies/mapproxy-api/issues/91)) ([37c52d5](https://github.com/MapColonies/mapproxy-api/commit/37c52d5e742babafb79b69ee6deec85fedfb19ad))

### [1.4.6](https://github.com/MapColonies/mapproxy-api/compare/v1.4.5...v1.4.6) (2022-04-24)


### Bug Fixes

* build and push workflow ([#87](https://github.com/MapColonies/mapproxy-api/issues/87)) ([dc33772](https://github.com/MapColonies/mapproxy-api/commit/dc33772015a861ab4436df8c3c34f1e0d3daa475))

### [1.4.5](https://github.com/MapColonies/mapproxy-api/compare/v1.4.4...v1.4.5) (2022-04-24)

### [1.4.4](https://github.com/MapColonies/mapproxy-api/compare/v1.4.3...v1.4.4) (2022-04-18)


### Bug Fixes

* helm db configs ([#86](https://github.com/MapColonies/mapproxy-api/issues/86)) ([5bb6611](https://github.com/MapColonies/mapproxy-api/commit/5bb6611900cf12479ed1b094f583707d59bb9f8e))

### [1.4.3](https://github.com/MapColonies/mapproxy-api/compare/v1.4.2...v1.4.3) (2022-02-21)

### [1.4.2](https://github.com/MapColonies/mapproxy-api/compare/v1.4.1...v1.4.2) (2022-02-21)


### Bug Fixes

* password ignore ([#82](https://github.com/MapColonies/mapproxy-api/issues/82)) ([37208a9](https://github.com/MapColonies/mapproxy-api/commit/37208a9a1535c0a3eb32663bf1ec0301392f7d34))

### [1.4.1](https://github.com/MapColonies/mapproxy-api/compare/v1.4.0...v1.4.1) (2022-02-16)


### Bug Fixes

* db schema creation script ([#81](https://github.com/MapColonies/mapproxy-api/issues/81)) ([00b8c5c](https://github.com/MapColonies/mapproxy-api/commit/00b8c5cad684753905c24f6901b40f427e74d22a))

## [1.4.0](https://github.com/MapColonies/mapproxy-api/compare/v1.3.2...v1.4.0) (2022-02-09)


### Features

* add db schema ([#80](https://github.com/MapColonies/mapproxy-api/issues/80)) ([14cc927](https://github.com/MapColonies/mapproxy-api/commit/14cc92733ca5834033af7782723abdaa397fc4f0))

### [1.3.2](https://github.com/MapColonies/mapproxy-api/compare/v1.3.1...v1.3.2) (2021-11-22)


### Bug Fixes

* fixed title value ([#77](https://github.com/MapColonies/mapproxy-api/issues/77)) ([29b7286](https://github.com/MapColonies/mapproxy-api/commit/29b72867d7a5adfae6f09a874915b72a03444cc1))

### [1.3.1](https://github.com/MapColonies/mapproxy-api/compare/v1.3.0...v1.3.1) (2021-11-07)


### Bug Fixes

* fixed tiles path from fs mount directory ([#76](https://github.com/MapColonies/mapproxy-api/issues/76)) ([a3b491b](https://github.com/MapColonies/mapproxy-api/commit/a3b491bdd344974d5b1cf0ec721ff18a8cf9ca54))

## [1.3.0](https://github.com/MapColonies/mapproxy-api/compare/v1.2.2...v1.3.0) (2021-10-19)


### Features

* fix ssl format and npm audit fix ([#74](https://github.com/MapColonies/mapproxy-api/issues/74)) ([cd8fe70](https://github.com/MapColonies/mapproxy-api/commit/cd8fe702b81a7bfdcb1728dde469288b7e55ef70))

### [1.2.2](https://github.com/MapColonies/mapproxy-api/compare/v1.2.1...v1.2.2) (2021-07-18)

### [1.2.1](https://github.com/MapColonies/mapproxy-api/compare/v1.2.0...v1.2.1) (2021-07-18)

## [1.2.0](https://github.com/MapColonies/mapproxy-api/compare/v1.1.0...v1.2.0) (2021-07-14)


### Features

* added fs cache dir support as source ([#69](https://github.com/MapColonies/mapproxy-api/issues/69)) ([cae75b6](https://github.com/MapColonies/mapproxy-api/commit/cae75b6aee7571f1fe4dad0d2a7bf62eec67666a))

## [1.1.0](https://github.com/MapColonies/mapproxy-api/compare/v1.0.1...v1.1.0) (2021-07-06)


### Features

* added db provider, removed init-config and default yaml file, updated tests ([#65](https://github.com/MapColonies/mapproxy-api/issues/65)) ([69fad4d](https://github.com/MapColonies/mapproxy-api/commit/69fad4db8fb507ed9d314c78c3d6fdbbee8f53f9))
* added support for s3 and fs config file provider ([#53](https://github.com/MapColonies/mapproxy-api/issues/53)) ([34f847b](https://github.com/MapColonies/mapproxy-api/commit/34f847b1e9f48871e6f5b36cc190732b49f4312e))
* Gpkg format support ([#58](https://github.com/MapColonies/mapproxy-api/issues/58)) ([2182c1e](https://github.com/MapColonies/mapproxy-api/commit/2182c1ee65b73fda66dca8fa482ef3ba5dc3dc44))


### Bug Fixes

* snyc issues ([#61](https://github.com/MapColonies/mapproxy-api/issues/61)) ([d9f5918](https://github.com/MapColonies/mapproxy-api/commit/d9f59185d9ae38f07c59788de2855f06b46cee08))

### [1.0.1](https://github.com/MapColonies/mapproxy-api/compare/v0.0.1...v1.0.1) (2021-03-16)


### Bug Fixes

* fixed Dockerfile ([#52](https://github.com/MapColonies/mapproxy-api/issues/52)) ([7f985e3](https://github.com/MapColonies/mapproxy-api/commit/7f985e394752d18e45b395dc19945ae530aca276))
