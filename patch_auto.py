import glob, os

matches = glob.glob("venv/lib/python*/site-packages/llama_cpp/ctypes_extensions.py")
if not matches:
    matches = glob.glob("**/ctypes_extensions.py", recursive=True)

if matches:
    target_path = matches[0]
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
    print(f"SUCCESS: Patched -> {target_path}")
else:
    print("ERROR: Could not find ctypes_extensions.py anywhere.")
