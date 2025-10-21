import re
from pathlib import Path

# === CONFIG ===
INPUT_FILE = "style.css"
OUTPUT_FILE = "style2.css"
BASE_WIDTH = 1920
BASE_HEIGHT = 1080
# ===============

vw_per_px = 100 / BASE_WIDTH
vh_per_px = 100 / BASE_HEIGHT

HEIGHT_PROPS = [
    "height", "top", "bottom", "margin-top", "margin-bottom",
    "padding-top", "padding-bottom", "line-height", "min-height", "max-height"
]

def parse_blocks(css_text):
    """Split CSS into blocks with selectors and declarations"""
    pattern = r'([^{]+)\{([^}]+)\}'
    return re.findall(pattern, css_text, re.DOTALL)

def convert_block(selector, declarations):
    width_val = None
    height_val = None

    # Extract width and height values in px (if any)
    for prop, val in re.findall(r'([\w-]+)\s*:\s*([\d.]+)px', declarations):
        if prop.strip() == "width":
            width_val = float(val)
        elif prop.strip() == "height":
            height_val = float(val)

    # If width and height are roughly the same → use vmin
    use_vmin = width_val and height_val and abs(width_val - height_val) <= 1

    def replacement(match):
        value = float(match.group(1))
        prop_context = match.string[max(0, match.start() - 40):match.start()].lower()

        if use_vmin:
            return f"{round(value * (100 / 1080), 3)}vmin"
        elif any(p in prop_context for p in HEIGHT_PROPS):
            return f"{round(value * vh_per_px, 3)}vh"
        else:
            return f"{round(value * vw_per_px, 3)}vw"

    new_declarations = re.sub(r'(\d+(?:\.\d+)?)px', replacement, declarations)
    return f"{selector}{{{new_declarations}}}"

def convert_css(css_text):
    blocks = parse_blocks(css_text)
    converted = [convert_block(sel, dec) for sel, dec in blocks]
    return "\n\n".join(converted)

def main():
    css_path = Path(INPUT_FILE)
    if not css_path.exists():
        print(f"❌ File not found: {INPUT_FILE}")
        return

    css_text = css_path.read_text(encoding="utf-8")
    converted = convert_css(css_text)
    Path(OUTPUT_FILE).write_text(converted, encoding="utf-8")
    print(f"✅ Converted CSS saved as: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
