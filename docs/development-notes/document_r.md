# NVDocument Guide for R Developers

This guide provides an example of how to create an `NVDocument` in R, read `.nii` files, encode them as base64, and save the resulting document in `.nvd` format. The example mirrors the structure typically used in JavaScript but is implemented using R.

## Prerequisites

### Required Libraries

Ensure you have the following R libraries installed:

```r
install.packages("jsonlite")
install.packages("base64enc")
```
### Required Files

You will also need the following files:

- niivue_defaults.json: Contains default configuration options for NVDocument.
- image_options_defaults.json: Contains default image options settings.
- A .nii file (e.g., mni152.nii) to encode.

## Code Example

Below is a step-by-step explanation of the code used to create an NVDocument in R.

### Step 1: Load Default Options

We start by loading default settings from niivue_defaults.json and image_options_defaults.json using the jsonlite package:
```r
library(jsonlite)

# Function to load default options from a JSON file
load_default_options <- function(file_path) {
  if (!file.exists(file_path)) {
    stop(paste("File not found:", file_path))
  }
  return(fromJSON(file_path))
}
```
### Step 2: Create the NVDocument Structure

We define a function create_nvdocument to initialize an NVDocument object with default settings:
```r
create_nvdocument <- function(title = "Untitled document") {
  nvdocument <- list(
    title = title,
    imageOptionsArray = list(),
    meshOptionsArray = list(),
    opts = load_default_options("niivue_defaults.json"),
    previewImageDataURL = "",
    labels = list(),
    encodedImageBlobs = list(),
    encodedDrawingBlob = "",
    sceneData = list(
      azimuth = 110,
      elevation = 10,
      crosshairPos = c(0.5, 0.5, 0.5),
      clipPlane = c(0, 0, 0, 0),
      clipPlaneDepthAziElev = c(2, 0, 0),
      volScaleMultiplier = 1.0,
      pan2Dxyzmm = c(0, 0, 0, 1),
      clipThick = 2.0,
      clipVolumeLow = c(0, 0, 0),
      clipVolumeHigh = c(1.0, 1.0, 1.0)
    )
  )
  return(nvdocument)
}
```
### Step 3: Add Image Options

To add image options to the document, we create the function add_image_options:
```r
add_image_options <- function(nvdocument, image_id, name) {
  image_options <- load_default_options("image_options_defaults.json")
  image_options$id <- image_id
  image_options$name <- name
  nvdocument$imageOptionsArray[[length(nvdocument$imageOptionsArray) + 1]] <- image_options
  return(nvdocument)
}
```
### Step 4: Encode a .nii File to Base64

We can now read and encode a .nii file as base64 using the base64enc package:
```r
library(base64enc)

encode_nii_to_base64 <- function(nii_file_path) {
  if (!file.exists(nii_file_path)) {
    stop(paste("File not found:", nii_file_path))
  }
  nii_data <- readBin(nii_file_path, what = "raw", n = file.info(nii_file_path)$size)
  return(base64encode(nii_data))
}
```
### Step 5: Save the NVDocument

Finally, we save the NVDocument object to a .nvd file in JSON format:
```r
save_to_nvd <- function(nvdocument, file_path) {
  json_output <- toJSON(nvdocument, pretty = TRUE, auto_unbox = TRUE, null = "null")
  write(json_output, file_path)
}
```
### Complete Example
```r
# Example Usage:
nvdocument <- create_nvdocument("Sample NV Document")
encoded_nii <- encode_nii_to_base64("mni152.nii")
nvdocument$encodedImageBlobs[[1]] <- encoded_nii

# Add image options for the nii file
nvdocument <- add_image_options(nvdocument, image_id = 1, name = "mni152.nii")

# Save the NVDocument to a .nvd file
save_to_nvd(nvdocument, "nvdocument.nvd")
```
### Conclusion

This R script demonstrates how to:
- Load default options from JSON files.
- Read .nii files, encode them to base64, and store them in NVDocument.
- Save the resulting document as a .nvd file.

### Example JSON files
niivue_defaults.json
```json
{
    "textHeight": 0.06,
    "colorbarHeight": 0.05,
    "crosshairWidth": 1,
    "crosshairGap": 0,
    "crosshairPos": [
        0.5,
        0.5,
        0.5
    ],
    "rulerWidth": 4,
    "show3Dcrosshair": true,
    "backColor": [
        0,
        0,
        0,
        1
    ],
    "crosshairColor": [
        1,
        0,
        0,
        1
    ],
    "fontColor": [
        0.5,
        0.5,
        0.5,
        1
    ],
    "selectionBoxColor": [
        1,
        1,
        1,
        0.5
    ],
    "clipPlaneColor": [
        0.7,
        0,
        0.7,
        0.5
    ],
    "clipThick": 2,
    "clipVolumeLow": [
        0,
        0,
        0
    ],
    "clipVolumeHigh": [
        1.0,
        1.0,
        1.0
    ],
    "rulerColor": [
        1,
        0,
        0,
        0.8
    ],
    "colorbarMargin": 0.05,
    "trustCalMinMax": true,
    "clipPlaneHotKey": "KeyC",
    "viewModeHotKey": "KeyV",
    "doubleTouchTimeout": 500,
    "longTouchTimeout": 1000,
    "keyDebounceTime": 50,
    "isNearestInterpolation": false,
    "isResizeCanvas": true,
    "atlasOutline": 0,
    "isRuler": false,
    "isColorbar": false,
    "isOrientCube": false,
    "multiplanarPadPixels": 0,
    "multiplanarShowRender": 2,
    "isRadiologicalConvention": false,
    "meshThicknessOn2D": "infinity",
    "dragMode": 1,
    "yoke3Dto2DZoom": false,
    "isDepthPickMesh": false,
    "isCornerOrientationText": false,
    "sagittalNoseLeft": false,
    "isSliceMM": false,
    "isV1SliceShader": false,
    "isHighResolutionCapable": true,
    "logLevel": "info",
    "loadingText": "waiting for updated images...",
    "isForceMouseClickToVoxelCenters": false,
    "dragAndDropEnabled": true,
    "drawingEnabled": false,
    "penValue": 1,
    "floodFillNeighbors": 6,
    "isFilledPen": false,
    "thumbnail": "",
    "maxDrawUndoBitmaps": 8,
    "sliceType": 3,
    "meshXRay": 0.0,
    "isAntiAlias": null,
    "limitFrames4D": "NaN",
    "isAdditiveBlend": false,
    "showLegend": true,
    "legendBackgroundColor": [
        0.3,
        0.3,
        0.3,
        0.5
    ],
    "legendTextColor": [
        1.0,
        1.0,
        1.0,
        1.0
    ],
    "multiplanarLayout": 0,
    "renderOverlayBlend": 1.0,
    "sliceMosaicString": "",
    "centerMosaic": false,
    "clickToSegment": false,
    "clickToSegmentRadius": 2,
    "clickToSegmentSteps": 10,
    "clickToSegmentBright": true
}
```
image_options_defaults.json
```json
{
    "url": "",
    "name": "nifti file",
    "colormap": "gray",
    "opacity": 1,
    "trustCalMinMax": true,
    "imageType": 1
}
```
