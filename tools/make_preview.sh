#!/bin/bash
# Build the published preview from the repo: same files, libraries from jsDelivr instead of assets/vendor.
# three/tsl must be build/three.tsl.js: jsDelivr's three.webgpu.min.js imports "./three.tsl.js", and a second
# copy (three.tsl.min.js) would give two TSL instances and broken node shaders.
set -e
R=/home/claude/repo/hirise-vr-guide; P=/home/claude/preview
for f in index.html science.html; do
  cp $R/$f $P/$f
  sed -i -e 's#\./assets/vendor/three/three.module.min.js#https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js#' \
         -e 's#\./assets/vendor/three/three.webgpu.min.js#https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.webgpu.min.js#' \
         -e 's#\./assets/vendor/three/three.tsl.min.js#https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.tsl.js#' \
         -e 's#\./assets/vendor/three/addons/#https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/#' \
         -e 's#assets/vendor/gsap/gsap.min.js#https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js#' \
         -e 's#assets/vendor/gsap/ScrollTrigger.min.js#https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js#' \
         -e 's#assets/vendor/lenis/lenis.min.js#https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js#' \
         -e 's#assets/vendor/lenis/lenis.css#https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.css#' $P/$f
done
mkdir -p $P/assets/css $P/assets/js
cp $R/assets/css/site.css $P/assets/css/site.css
sed -i 's#@import url("../vendor/lenis/lenis.css");#@import url("https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.css");#' $P/assets/css/site.css
cp $R/assets/js/*.js $P/assets/js/
echo "vendor refs left: $(cat $P/index.html $P/science.html $P/assets/css/site.css | grep -c 'vendor/' || true)"
