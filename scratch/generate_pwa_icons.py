import os
from PIL import Image

def create_pwa_icons():
    source_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/logo-wave.jpg"))
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public"))
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return

    img = Image.open(source_path)
    
    # Kích thước tiêu chuẩn
    sizes = [192, 512]
    
    for size in sizes:
        # 1. Tạo icon thông thường (Square Fit)
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        resized_img.save(os.path.join(output_dir, f"logo-wave-{size}.png"), "PNG")
        print(f"Created: logo-wave-{size}.png")
        
        # 2. Tạo Maskable Icon (đệm 15% viền để icon không bị cắt trên các hệ điều hành)
        padding = int(size * 0.15)
        inner_size = size - (padding * 2)
        
        inner_img = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        
        # Khung nền trắng cho maskable icon
        maskable_img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        maskable_img.paste(inner_img, (padding, padding))
        maskable_img.save(os.path.join(output_dir, f"logo-wave-maskable-{size}.png"), "PNG")
        print(f"Created: logo-wave-maskable-{size}.png")

if __name__ == "__main__":
    create_pwa_icons()
