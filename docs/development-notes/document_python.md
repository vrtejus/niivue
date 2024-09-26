# NVDocument Guide for Python Developers

This guide provides an example of how to create an `NVDocument` in Python, read `.nii` files, encode them as base64, and save the resulting document in `.nvd` format. The example mirrors the structure typically used in JavaScript but is implemented using Python.

## Prerequisites

### Required Libraries

Ensure you have the following Python libraries installed:

```bash
pip install json base64
```
Required Files

You will also need the following files:

- niivue_defaults.json: Contains default configuration options for NVDocument.
- image_options_defaults.json: Contains default image options settings.
- A .nii file (e.g., mni152.nii) to encode.

### Code Example

Below is a step-by-step explanation of the code used to create an NVDocument in Python.

#### Step 1: Load Default Options

We start by loading default settings from niivue_defaults.json and image_options_defaults.json using the json library:
```python
import json

# Function to load default options from a JSON file
def load_default_options(file_path):
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        raise Exception(f"File not found: {file_path}")
```
#### Step 2: Create the NVDocument Structure

We define a class NVDocument to initialize an NVDocument object with default settings. The scene data, image options, and document structure will be stored here.

```python
class NVDocument:
    def __init__(self, title="Untitled document", preview_image_url=""):
        # Load default options from niivue_defaults.json
        self.data = {
            "title": title,
            "imageOptionsArray": [],
            "meshOptionsArray": [],
            "opts": load_default_options('niivue_defaults.json'),
            "previewImageDataURL": preview_image_url,
            "labels": [],
            "encodedImageBlobs": [],
            "encodedDrawingBlob": ""
        }
        self.scene = {
            "azimuth": 110,
            "elevation": 10,
            "crosshairPos": [0.5, 0.5, 0.5],
            "clipPlane": [0, 0, 0, 0],
            "clipPlaneDepthAziElev": [2, 0, 0],
            "volScaleMultiplier": 1.0,
            "pan2Dxyzmm": [0, 0, 0, 1],
            "clipThick": 2.0,
            "clipVolumeLow": [0, 0, 0],
            "clipVolumeHigh": [1.0, 1.0, 1.0]
        }
```
#### Step 3: Add Image Options

To add image options to the document, we create the add_image_options method. This will add image-specific details (such as the image_id and name) based on the image_options_defaults.json file.
```python
# Function to add image options from a default JSON file
def add_image_options(self, image_id, name):
    image_options = load_default_options('image_options_defaults.json')
    image_options["id"] = image_id
    image_options["name"] = name
    self.data["imageOptionsArray"].append(image_options)
```
#### Step 4: Encode a .nii File to Base64

We can now read and encode a .nii file as base64 using the base64 library:
```python
import base64
import os

# Function to encode .nii file to base64
def encode_nii_to_base64(self, nii_file_path):
    if not os.path.exists(nii_file_path):
        raise FileNotFoundError(f"{nii_file_path} not found.")
    
    with open(nii_file_path, "rb") as nii_file:
        encoded_data = base64.b64encode(nii_file.read()).decode('utf-8')
    return encoded_data
```
#### Step 5: Serialize the Scene Data and Save the NVDocument

We need to serialize the scene as sceneData before saving the document. Here’s the save_to_file method that does that and saves the document to a .nvd file in JSON format:
```python
# Save NVDocument to a .nvd file (JSON format)
def save_to_file(self, file_path):
    # Add scene data to the document
    self.data["sceneData"] = self.scene
    
    # Convert Infinity and NaN to strings for valid JSON
    safe_data = self.convert_infinity(self.data)

    with open(file_path, 'w') as file:
        json.dump(safe_data, file, indent=4)
```
The convert_infinity method is needed to convert Infinity and NaN values to valid JSON-friendly strings:
```python
# Function to handle Infinity and NaN values
def convert_infinity(self, data):
    """Recursively convert `Infinity` to string 'infinity' and handle NaN."""
    if isinstance(data, dict):
        return {key: self.convert_infinity(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [self.convert_infinity(item) for item in data]
    elif data == float('inf'):
        return 'infinity'
    elif isinstance(data, float) and data != data:  # Check for NaN
        return 'NaN'
    return data
```
#### Complete Example

Below is a complete example of how to use the NVDocument class to create a document, read and encode a .nii file, and save it as .nvd.
```python
# Complete Example Usage
nv_document = NVDocument(title="Sample NV Document")

# Add image options for mni152.nii and encode it to base64
encoded_nii = nv_document.encode_nii_to_base64("mni152.nii")
nv_document.data["encodedImageBlobs"].append(encoded_nii)

# Add image options for the nii file using defaults from image_options_defaults.json
nv_document.add_image_options(image_id=1, name="mni152.nii")

# Save the NVDocument to a .nvd file
nv_document.save_to_file("nvdocument.nvd")
```
Conclusion

This Python script demonstrates how to:

- Load default options from JSON files.
- Read .nii files, encode them to base64, and store them in NVDocument.
- Save the resulting document as a .nvd file.

By using this structure, Python developers can easily work with the NVDocument system in their projects.

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

Image options
```typescript
ImageFromUrlOptions = {
  // the resolvable URL pointing to a nifti image to load
  url: string
  // Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
  urlImageData?: string
  // headers to use in the fetch call
  headers?: Record<string, string>
  // a name for this image (defaults to empty)
  name?: string
  // a color map to use (defaults to gray)
  colorMap?: string
  // TODO see duplicate usage in niivue/loadDocument
  colormap?: string
  // the opacity for this image (defaults to 1)
  opacity?: number
  // minimum intensity for color brightness/contrast
  cal_min?: number
  // maximum intensity for color brightness/contrast
  cal_max?: number
  // whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading, defaults to true)
  trustCalMinMax?: boolean
  // the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges, defaults to 0.02)
  percentileFrac?: number
  // whether or not to use QForm over SForm constructing the NVImage instance (defaults to false)
  useQFormNotSForm?: boolean
  // if true, values below cal_min are shown as translucent, not transparent (defaults to false)
  alphaThreshold?: boolean
  // a color map to use for negative intensities
  colormapNegative?: string
  // backwards compatible option
  colorMapNegative?: string
  // minimum intensity for colormapNegative brightness/contrast (NaN for symmetrical cal_min)
  cal_minNeg?: number
  // maximum intensity for colormapNegative brightness/contrast (NaN for symmetrical cal_max)
  cal_maxNeg?: number
  // show/hide colormaps (defaults to true)
  colorbarVisible?: boolean
  // TODO the following fields were not documented
  ignoreZeroVoxels?: boolean
  imageType?: ImageType
  frame4D?: number
  colormapLabel?: LUT | null
  pairedImgData?: null
  limitFrames4D?: number
  isManifest?: boolean
  urlImgData?: string
  buffer?: ArrayBuffer
}
```