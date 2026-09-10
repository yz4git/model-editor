# MakeHuman reference data

Source: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
Git blob: d26635e9326e3cca30778fd7b9c00062b03cce09
Asset: basemesh hm08
License: CC0-1.0, explicitly stated in the source header (September 2020).
License text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

Source header credits Data Collection AB, Joel Palmius and Jonas Hauquier (2020). MakeHuman homepage: https://www.makehumancommunity.org/

Changes: retain body and eye surfaces; exclude clothing, genital and other helpers and joint marker geometry; remap indices; normalize body height; round normalized coordinates to seven decimal places. Joint marker centroids become numeric anchors, not mesh geometry. No MakeHuman program code or licensed statistical SMPL/FLAME model data is included.

## Optional photo detection

MediaPipe Tasks Vision 0.10.14 (Google) is dynamically loaded from jsDelivr; model assets are fetched from the official Google MediaPipe model bucket. No MediaPipe binary is bundled in this repository. See docs/PHOTO_FITTING.md for exact versioned URLs and primary documentation.
