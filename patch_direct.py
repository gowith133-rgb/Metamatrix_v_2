import os

target_path = "venv/lib/python3.14/site-packages/llama_cpp/ctypes_extensions.py"
if os.path.exists(target_path):
    with open(target_path, "r") as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if "raise RuntimeError" in line or "Unsupported platform" in line:
            new_lines.append("    return _lib_path\n")
        else:
            new_lines.append(line)
            
    with open(target_path, "w") as f:
        f.writelines(new_lines)
    print("SUCCESS: Patched ctypes_extensions.py successfully!")
else:
    print("ERROR: Target path not found.")
