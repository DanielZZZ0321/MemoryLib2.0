# PDF Extraction Tool

## Location
Script: `/home/why/Project/MemoryLib2.0/why/tool/pdf_extractor.py`

## Usage
```bash
python3 /home/why/Project/MemoryLib2.0/why/tool/pdf_extractor.py "<PDF路径>" [输出目录]
```

## Output
- `content.txt` - Text with image markers `[图片: images/image_001.png]`
- `images/` - Extracted images

## Requirements
- PyMuPDF (`pip install PyMuPDF`)