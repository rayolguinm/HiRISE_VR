// HiRISE technical glossary and reference list for the pipeline reference page.
// Every definition is written in our own words and cites the peer-reviewed or agency publications it
// draws on, by number in REFS. Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
(function () {
  "use strict";

  // [authors (year). title. venue. doi or url]
  var REFS = [
    ["McEwen, A. S., et al. (2007)", "Mars Reconnaissance Orbiter's High Resolution Imaging Science Experiment (HiRISE).", "Journal of Geophysical Research: Planets, 112, E05S02.", "10.1029/2005JE002605"],
    ["McEwen, A. S., et al. (2010)", "The High Resolution Imaging Science Experiment (HiRISE) during MRO's Primary Science Phase (PSP).", "Icarus, 205, 2–37.", "10.1016/j.icarus.2009.04.023"],
    ["McEwen, A. S., et al. (2024)", "The High-Resolution Imaging Science Experiment (HiRISE) in the MRO extended science phases (2009–2023).", "Icarus, 419, 115795.", "10.1016/j.icarus.2023.115795"],
    ["Delamere, W. A., et al. (2010)", "Color imaging of Mars by the High Resolution Imaging Science Experiment (HiRISE).", "Icarus, 205, 38–52.", "10.1016/j.icarus.2009.03.012"],
    ["Becker, K. J., et al. (2022)", "hical: the HiRISE radiometric calibration software developed within the ISIS3 planetary image processing suite.", "U.S. Geological Survey Techniques and Methods 7–C27.", "10.3133/tm7c27"],
    ["Sutton, S. S., et al. (2017)", "Correcting spacecraft jitter in HiRISE images.", "ISPRS Archives, XLII-3/W1, 141–148.", "10.5194/isprs-archives-XLII-3-W1-141-2017"],
    ["Sutton, S. S., et al. (2019)", "Correcting spacecraft jitter in HiRISE images.", "In Planetary Remote Sensing and Mapping, CRC Press, 91–106.", "10.1201/9780429505997-8"],
    ["Kirk, R. L., et al. (2007)", "Ultrahigh resolution topographic mapping of Mars with HiRISE stereo images: methods and first results.", "International Cartographic Conference 2007.", "https://www.usgs.gov/publications/ultrahigh-resolution-topographic-mapping-mars-hirise-stereo-images-methods-and-first"],
    ["Kirk, R. L., et al. (2008)", "Ultrahigh resolution topographic mapping of Mars with MRO HiRISE stereo images: meter-scale slopes of candidate Phoenix landing sites.", "Journal of Geophysical Research: Planets, 113, E00A24.", "10.1029/2007JE003000"],
    ["Kirk, R. L., Howington-Kraus, E., Hare, T. M., & Jorda, L. (2016)", "The effect of illumination on stereo DTM quality: simulations in support of Europa exploration.", "ISPRS Annals, III-4, 103–110.", "10.5194/isprs-annals-III-4-103-2016"],
    ["Kirk, R. L., et al. (2020)", "Evaluating stereo DTM quality at Jezero Crater, Mars with HRSC, CTX, and HiRISE images.", "ISPRS Archives, XLIII-B3-2020, 1129–1136.", "10.5194/isprs-archives-XLIII-B3-2020-1129-2020"],
    ["Kirk, R. L., et al. (2021)", "Evaluating stereo digital terrain model quality at Mars rover landing sites with HRSC, CTX, and HiRISE images.", "Remote Sensing, 13(17), 3511.", "10.3390/rs13173511"],
    ["Sutton, S. S., Chojnacki, M., McEwen, A. S., Kirk, R. L., et al. (2022)", "Revealing active Mars with HiRISE digital terrain models.", "Remote Sensing, 14(10), 2403.", "10.3390/rs14102403"],
    ["Beyer, R. A., Alexandrov, O., & McMichael, S. (2018)", "The Ames Stereo Pipeline: NASA's open source software for deriving and processing terrain data.", "Earth and Space Science, 5(9), 537–548.", "10.1029/2018EA000409"],
    ["Hepburn, A. J., Holt, T., Hubbard, B., & Ng, F. (2019)", "Creating HiRISE digital elevation models for Mars using the open-source Ames Stereo Pipeline.", "Geoscientific Instrumentation, Methods and Data Systems, 8(2), 293–313.", "10.5194/gi-8-293-2019"],
    ["Beyer, R. A. (2017)", "Meter-scale slopes of candidate InSight landing sites from point photoclinometry.", "Space Science Reviews, 211, 97–107.", "10.1007/s11214-016-0287-7"],
    ["Fergason, R. L., et al. (2017)", "Analysis of local slopes at the InSight landing site on Mars.", "Space Science Reviews, 211, 109–133.", "10.1007/s11214-016-0292-x"],
    ["Golombek, M., et al. (2012)", "Selection of the Mars Science Laboratory landing site.", "Space Science Reviews, 170, 641–737.", "10.1007/s11214-012-9916-y"],
    ["Golombek, M., et al. (2017)", "Selection of the InSight landing site.", "Space Science Reviews, 211, 5–95.", "10.1007/s11214-016-0321-9"],
    ["Grant, J. A., Golombek, M. P., Wilson, S. A., et al. (2018)", "The science process for selecting the landing site for the 2020 Mars rover.", "Planetary and Space Science, 164, 106–126.", "10.1016/j.pss.2018.07.001"],
    ["McEwen, A. S., et al. (2011)", "Seasonal flows on warm Martian slopes.", "Science, 333, 740–743.", "10.1126/science.1204816"],
    ["McEwen, A. S., et al. (2014)", "Recurring slope lineae in equatorial regions of Mars.", "Nature Geoscience, 7, 53–58.", "10.1038/ngeo2014"],
    ["Ojha, L., et al. (2014)", "HiRISE observations of Recurring Slope Lineae (RSL) during southern summer on Mars.", "Icarus, 231, 365–376.", "10.1016/j.icarus.2013.12.021"],
    ["Ojha, L., et al. (2015)", "Spectral evidence for hydrated salts in recurring slope lineae on Mars.", "Nature Geoscience, 8, 829–832.", "10.1038/ngeo2546"],
    ["Stillman, D. E., Michaels, T. I., Grimm, R. E., & Harrison, K. P. (2014)", "New observations of martian southern mid-latitude recurring slope lineae (RSL) imply formation by freshwater subsurface flows.", "Icarus, 233, 328–341.", "10.1016/j.icarus.2014.01.017"],
    ["Dundas, C. M., McEwen, A. S., Chojnacki, M., Milazzo, M. P., Byrne, S., McElwaine, J. N., & Urso, A. (2017)", "Granular flows at recurring slope lineae on Mars indicate a limited role for liquid water.", "Nature Geoscience, 10, 903–907.", "10.1038/s41561-017-0012-5"],
    ["Dundas, C. M., Diniega, S., Hansen, C. J., Byrne, S., & McEwen, A. S. (2012)", "Seasonal activity and morphological changes in martian gullies.", "Icarus, 220(1), 124–143.", "10.1016/j.icarus.2012.04.005"],
    ["Dundas, C. M., Diniega, S., & McEwen, A. S. (2015)", "Long-term monitoring of martian gully formation and evolution with MRO/HiRISE.", "Icarus, 251, 244–263.", "10.1016/j.icarus.2014.05.013"],
    ["Diniega, S., Byrne, S., Bridges, N. T., Dundas, C. M., & McEwen, A. S. (2010)", "Seasonality of present-day Martian dune-gully activity.", "Geology, 38, 1047–1050.", "10.1130/G31287.1"],
    ["Byrne, S., et al. (2009)", "Distribution of mid-latitude ground ice on Mars from new impact craters.", "Science, 325(5948), 1674–1676.", "10.1126/science.1175307"],
    ["Dundas, C. M., Byrne, S., McEwen, A. S., et al. (2014)", "HiRISE observations of new impact craters exposing Martian ground ice.", "Journal of Geophysical Research: Planets, 119, 109–127.", "10.1002/2013JE004482"],
    ["Dundas, C. M., et al. (2018)", "Exposed subsurface ice sheets in the Martian mid-latitudes.", "Science, 359(6372), 199–201.", "10.1126/science.aao1619"],
    ["Daubar, I. J., McEwen, A. S., Byrne, S., Kennedy, M. R., & Ivanov, B. (2013)", "The current martian cratering rate.", "Icarus, 225, 506–516.", "10.1016/j.icarus.2013.04.009"],
    ["Daubar, I. J., et al. (2022)", "New craters on Mars: an updated catalog.", "Journal of Geophysical Research: Planets, 127(7), e2021JE007145.", "10.1029/2021JE007145"],
    ["Hansen, C. J., et al. (2011)", "Seasonal erosion and restoration of Mars' northern polar dunes.", "Science, 331(6017), 575–578.", "10.1126/science.1197636"],
    ["Bridges, N. T., et al. (2012)", "Earth-like sand fluxes on Mars.", "Nature, 485, 339–342.", "10.1038/nature11022"],
    ["Bridges, N., et al. (2012)", "Planet-wide sand motion on Mars.", "Geology, 40(1), 31–34.", "10.1130/G32373.1"],
    ["Chojnacki, M., Banks, M. E., Fenton, L. K., & Urso, A. C. (2019)", "Boundary condition controls on the high-sand-flux regions of Mars.", "Geology, 47, 427–430.", "10.1130/G45793.1"],
    ["Urso, A., Chojnacki, M., & Vaz, D. (2018)", "Dune-yardang interactions in Becquerel crater, Mars.", "Journal of Geophysical Research: Planets, 123, 353–368.", "10.1002/2017JE005465"],
    ["Chojnacki, M., Vaz, D. A., Silvestro, S., & Silva, D. C. A. (2021)", "Widespread megaripple activity across the north polar ergs of Mars.", "Journal of Geophysical Research: Planets, 126, e2021JE006970.", "10.1029/2021JE006970"],
    ["Herkenhoff, K. E., Byrne, S., Russell, P. S., Fishbaugh, K. E., & McEwen, A. S. (2007)", "Meter-scale morphology of the north polar region of Mars.", "Science, 317(5845), 1711–1715.", "10.1126/science.1143544"],
    ["Russell, P., et al. (2008)", "Seasonally active frost-dust avalanches on a north polar scarp of Mars captured by HiRISE.", "Geophysical Research Letters, 35(23), L23204.", "10.1029/2008GL035790"],
    ["Fanara, L., Gwinner, K., Hauber, E., & Oberst, J. (2020)", "Present-day erosion rate of north polar scarps on Mars due to active mass wasting.", "Icarus, 342, 113434.", "10.1016/j.icarus.2019.113434"],
    ["Su, S., Fanara, L., Xiao, H., Hauber, E., & Oberst, J. (2025)", "Mass wasting reveals ongoing asymmetric retreat of the martian north polar ice cap.", "Nature Communications, 16, 820.", "10.1038/s41467-025-56018-2"],
    ["Keszthelyi, L., et al. (2008)", "High Resolution Imaging Science Experiment (HiRISE) images of volcanic terrains from the first 6 months of the Mars Reconnaissance Orbiter Primary Science Phase.", "Journal of Geophysical Research: Planets, 113.", "10.1029/2007JE002968"],
    ["Keszthelyi, L. P., et al. (2010)", "Hydrovolcanic features on Mars: preliminary observations from the first Mars year of HiRISE imaging.", "Icarus, 205, 211–229.", "10.1016/j.icarus.2009.08.020"],
    ["Okubo, C. H., Lewis, K. W., McEwen, A. S., & Kirk, R. L. (2008)", "Relative age of interior layered deposits in southwest Candor Chasma based on high-resolution structural mapping.", "Journal of Geophysical Research: Planets, 113, E12002.", "10.1029/2008JE003181"],
    ["Okubo, C. H. (2010)", "Structural geology of Amazonian-aged layered sedimentary deposits in southwest Candor Chasma, Mars.", "Icarus, 207, 210–225.", "10.1016/j.icarus.2009.11.012"],
    ["Lewis, K. W., Aharonson, O., Grotzinger, J. P., Kirk, R. L., McEwen, A. S., & Suer, T.-A. (2008)", "Quasi-periodic bedding in the sedimentary rock record of Mars.", "Science, 322(5907), 1532–1535.", "10.1126/science.1161870"],
    ["Kirk, R. L., et al. (2003)", "High-resolution topomapping of candidate MER landing sites with Mars Orbiter Camera narrow-angle images.", "Journal of Geophysical Research: Planets, 108(E12), 8088.", "10.1029/2003JE002131"],
    ["Snyder, J. P. (1987)", "Map Projections: A Working Manual.", "U.S. Geological Survey Professional Paper 1395.", "10.3133/pp1395"],
    ["Tanaka, K. L., et al. (2014)", "Geologic map of Mars.", "U.S. Geological Survey Scientific Investigations Map 3292.", "10.3133/sim3292"]
  ];

  // [term, category, definition, [reference numbers, 1-based]]
  var G = [
    ["HiRISE", "Instrument", "High Resolution Imaging Science Experiment on the Mars Reconnaissance Orbiter (MRO): a 0.5 m primary mirror, 12 m effective focal length pushbroom camera delivering 0.25 to 1.3 m/pixel images.", [1]],
    ["Pushbroom imaging", "Instrument", "The image is built line by line as the spacecraft moves along track, rather than in a single exposure; this makes the geometry sensitive to spacecraft pointing motion.", [6, 7, 1]],
    ["Focal plane array (FPA)", "Instrument", "Fourteen CCD detectors staggered across the focal plane, each 2048 pixels wide (cross-track) and 128 lines high (along-track) for TDI.", [1, 6]],
    ["Time Delay and Integration (TDI)", "Instrument", "Charge is shifted along the CCD in step with the ground motion so each patch of ground is imaged up to 128 times and summed, raising the signal-to-noise ratio (SNR).", [1, 4]],
    ["Binning", "Instrument", "On-chip summing of N × N adjacent pixels; HiRISE offers several binning modes, and bin 1, bin 2 and bin 4 are the ones behind the A, B and C orthoimage grids. It raises SNR and reduces data volume at the cost of ground sample distance; the BG and IR channels usually need 2×2 or 4×4.", [1, 4]],
    ["RED, BG and IR channels", "Instrument", "Ten RED CCDs cover the full swath in a broad red bandpass; blue-green (BG) and near-infrared (IR) CCDs cover the central ~20% of the swath, giving three-colour data there.", [4, 2]],
    ["Swath", "Instrument", "The cross-track width of an observation, typically 5 to 6 km, with image scales usually 25 to 60 cm/pixel.", [2]],
    ["Digital Number (DN)", "Data", "The raw quantised detector value; HiRISE digitises at 14 bits, i.e. 16,384 DN levels, converted to 8 bits for downlink in most images.", [1, 4]],
    ["Radiometric calibration (I/F)", "Data", "Correction of DN for instrument offset, drift, dark current, gain and flat field, then conversion to I/F reflectance, implemented in the ISIS3 program hical.", [5]],
    ["Pointing jitter", "Geometry", "Small mechanical oscillations of the spacecraft that distort pushbroom images and degrade stereo correlation; HiRISE measures them from offsets between overlapping CCDs and corrects the pointing.", [6, 7, 2]],
    ["PSP / ESP", "Data", "Primary Science Phase (2006–2008) and Extended Science Phase; the prefix of a product ID such as ESP_084570_1445.", [2, 3]],
    ["Stereo pair", "Photogrammetry", "Two images of the same site acquired from different viewing directions on different orbits; their parallax encodes topography.", [2, 9, 13]],
    ["Emission angle", "Geometry", "Angle between the camera line of sight and the local surface normal; together with the DTM height error it sets the horizontal displacement of an orthoimage pixel.", [13, 9]],
    ["Incidence angle", "Geometry", "Angle between the direction to the Sun and the surface normal. DTM quality drops at low incidence (little shading) and at high incidence (low SNR, shadows).", [10]],
    ["Digital Terrain Model (DTM)", "Photogrammetry", "A regular grid of surface elevations derived from a stereo pair; DTM and DEM are used interchangeably for HiRISE products.", [13, 9, 15]],
    ["Post spacing / ground sample distance (GSD)", "Photogrammetry", "The distance between adjacent DTM elevations (posts) or image pixels on the ground. HiRISE DTMs are produced at 1 m and 2 m.", [13]],
    ["Estimated vertical precision (EP)", "Photogrammetry", "The expected height error of a DTM from matching precision and stereo geometry: tens of centimetres at 1 m posts and about 1 m at 2 m posts.", [13, 12]],
    ["Matching precision", "Photogrammetry", "How accurately the stereo matcher locates corresponding points; 0.2 to 0.3 pixel is the rule of thumb confirmed for HiRISE, CTX and HRSC.", [12, 11, 13]],
    ["DTM horizontal resolution", "Photogrammetry", "The smallest landform the DTM truly resolves: about 10 to 20 image pixels, coarser than the 3 to 5 pixel post spacing.", [12, 11, 13]],
    ["Bundle adjustment", "Photogrammetry", "Joint adjustment of camera position and pointing for all images using tie points (and ground control) so the stereo images align before terrain extraction.", [13]],
    ["Terrain extraction (NGATE)", "Photogrammetry", "Automatic dense matching that produces the elevation grid; NGATE is the matcher in SOCET SET and GXP.", [12, 13]],
    ["ISIS and SOCET SET", "Software", "USGS ISIS prepares and corrects the images (calibration, jitter correction); the commercial SOCET SET workstation performs bundle adjustment and terrain extraction. This is the standard HiRISE DTM workflow.", [9, 13]],
    ["Ames Stereo Pipeline (ASP)", "Software", "NASA's open-source stereogrammetry suite, also used to build HiRISE DEMs.", [14, 15]],
    ["MOLA control", "Geodesy", "HiRISE DTMs are tied to crossover-corrected Mars Orbiter Laser Altimeter (MOLA) shot points, the primary source of absolute control, so their elevations are consistent with global topography.", [9, 13]],
    ["Orthoimage (orthorectification)", "Photogrammetry", "An image resampled through the DTM so that every pixel sits at its true map position, removing relief and viewing-geometry distortion.", [13]],
    ["Orthoimage time series and DTM differencing", "Change detection", "Repeat images orthorectified to one DTM, and the difference of DTMs from different dates, used to measure surface change.", [13]],
    ["Photoclinometry", "Photogrammetry", "Shape-from-shading: slopes estimated from image brightness, giving single-pixel spacing where stereo cannot.", [9, 16]],
    ["Slope baseline", "Engineering", "The horizontal distance over which a slope is measured (e.g. 1, 2, 5 m); landing-site safety is assessed at these baselines from HiRISE DTMs.", [17, 18, 19]],
    ["Sub-pixel image correlation (COSI-Corr)", "Change detection", "Co-registration of optically sensed images and correlation, measuring bedform displacement between orthorectified HiRISE images to a fraction of a pixel.", [36]],
    ["Recurring slope lineae (RSL)", "Science", "Narrow, dark markings on steep slopes that lengthen incrementally in warm seasons, fade, and recur in later Mars years.", [21, 22, 23]],
    ["Angle of repose", "Science", "The steepest stable slope for loose granular material; DTM slopes at RSL termini match the stopping angle of dry granular flows.", [26]],
    ["Gully activity", "Science", "Present-day formation of new channels, alcoves and deposits in martian gullies, linked to seasonal CO₂ frost.", [27, 28, 29]],
    ["New impact craters", "Science", "Craters formed within the last decades, bracketed by before-and-after images; some excavate bright subsurface ice.", [33, 34, 30, 31]],
    ["Mass wasting", "Science", "Downslope movement of material, such as frost-dust avalanches and ice block falls on the north polar scarps.", [42, 43, 44]],
    ["Equirectangular scale factor", "Geodesy", "Equirectangular maps are true to scale only at the projection's centre latitude; slopes and areas are corrected with k = cos(φ₁)/cos(φ).", [51]]
  ];

  function $(id) { return document.getElementById(id); }
  function link(doi) {
    if (!doi) return "";
    var href = doi.indexOf("http") === 0 ? doi : "https://doi.org/" + doi;
    var text = doi.indexOf("http") === 0 ? doi.replace(/^https?:\/\//, "") : "doi:" + doi;
    return ' <a href="' + href + '">' + text + "</a>";
  }

  var refList = $("refList");
  if (refList) {
    refList.innerHTML = REFS.map(function (r, i) {
      return '<li id="ref' + (i + 1) + '">' + r[0] + ". " + r[1] + " <i>" + r[2] + "</i>" + link(r[3]) + "</li>";
    }).join("");
    if ($("refCount")) $("refCount").textContent = REFS.length;
  }

  var gl = $("glossBody");
  if (gl) {
    var cats = ["All"].concat(G.map(function (g) { return g[1]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    var cat = "All";
    $("glossCats").innerHTML = cats.map(function (c) { return '<button type="button" data-c="' + c + '" aria-pressed="' + (c === "All") + '">' + c + "</button>"; }).join("");
    function render() {
      var q = $("glossFilter").value.trim().toLowerCase();
      var rows = G.filter(function (g) { return (cat === "All" || g[1] === cat) && (!q || (g[0] + " " + g[2]).toLowerCase().indexOf(q) >= 0); });
      gl.innerHTML = rows.map(function (g) {
        var cites = g[3].map(function (n) { return '<a href="#ref' + n + '">' + n + "</a>"; }).join(", ");
        return '<div class="gterm"><dt>' + g[0] + "<span>" + g[1] + "</span></dt><dd>" + g[2] + ' <sup class="gref">[' + cites + "]</sup></dd></div>";
      }).join("") || '<p class="muted">Nothing matches. Try a shorter word.</p>';
      $("glossCount").textContent = rows.length + " of " + G.length + " terms";
    }
    $("glossFilter").addEventListener("input", render);
    $("glossCats").addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      cat = b.dataset.c;
      $("glossCats").querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      render();
    });
    render();
    window.HiriseVR = window.HiriseVR || {}; window.HiriseVR.GLOSS = G;
  }
})();
