
### 1. Cài Rust

Trên Windows bạn chạy **PowerShell** (không phải Git Bash) và gõ:

```powershell
winget install Rustlang.Rustup
```

hoặc tải installer từ trang chính thức:
👉 [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)

Cài xong, mở PowerShell lại rồi kiểm tra:

```powershell
rustc --version
cargo --version
```

Nếu ra version thì OK.

---

### 2. Cài wasm-pack

Sau khi có Rust, bạn cài `wasm-pack` (cần để build ra WebAssembly):

```powershell
cargo install wasm-pack
```

Sau khi xong, thử:

```powershell
wasm-pack --version
```

---

### 3. Tạo project Rust

Giờ mới tạo được:

```powershell
cd "D:\working\Tu Hoc Lap Trinh\Frontend\React\react_rust\rust"
cargo new --lib wasm_math
```
