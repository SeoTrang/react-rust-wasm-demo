# Rust ↔ React (WASM) (Windows + Vite)

> Mục tiêu: tạo một thư viện Rust, biên dịch sang WebAssembly bằng `wasm-pack`, rồi nhúng vào ứng dụng React (Vite). Nội dung này phù hợp cho người mới bắt đầu Rust.

---

## Mục lục

1. Tổng quan
2. Yêu cầu (Requirements)
3. Cài đặt Rust & công cụ (Windows)
4. Tạo crate Rust (WASM library)
5. Viết code Rust (ví dụ counter + calculator)
6. Build thành WebAssembly bằng `wasm-pack`
7. Cách nhúng vào React (3 workflow)

   * A. `--target web` (copy `pkg/` vào `public/` và dynamic import)
   * B. `--target bundler` / `npm install ../pkg` (import như package)
   * C. Import từ `pkg` trực tiếp (local package)
8. Ví dụ component React (TypeScript + JS)
9. Dev workflow & tự động rebuild
10. Build production & lưu ý deploy
11. Troubleshooting (lỗi thường gặp và cách fix)
12. Ghi chú về kiểu dữ liệu, hiệu năng và bảo mật
13. Appendix — lệnh & script nhanh

---

# 1) Tổng quan

Rust + WebAssembly (WASM) cho phép bạn viết logic nhanh/tiết kiệm CPU bằng Rust, biên dịch thành `.wasm` rồi gọi từ JavaScript / React. Thông thường React giữ state và UI; mọi phép toán nặng hoặc logic nhạy cảm có thể được chuyển sang Rust.

# 2) Yêu cầu

* Windows (hướng dẫn này hướng tới Windows, macOS/Linux tương tự nhưng khác phần cài build tools)
* Rust toolchain: `rustup`, `cargo`, `rustc`
* target `wasm32-unknown-unknown`
* `wasm-pack` (dùng để build dễ dàng)
* Node.js & npm (Vite)
* Visual Studio Build Tools (MSVC) — trên Windows để link các crate native
* (Tuỳ chọn) `wasm-opt` (Binaryen) để tối ưu .wasm

---

# 3) Cài đặt Rust & công cụ (Windows)

### A. Cài Rust (rustup)

Mở PowerShell (khuyến nghị dùng PowerShell trên Windows):

```powershell
# cài bằng winget
winget install Rustlang.Rustup
# hoặc truy cập https://www.rust-lang.org/tools/install và làm theo hướng dẫn

# kiểm tra
rustc --version
cargo --version
```

Nếu `rustc` / `cargo` chưa chạy ngay sau khi cài: đóng PowerShell và mở lại (hoặc log out / log in). Nếu vẫn chưa, đảm bảo đường dẫn `C:\Users\<User>\.cargo\bin` có trong PATH.

### B. Cài Visual Studio Build Tools (nếu Windows)

Rust default dùng toolchain MSVC — bạn cần cài Visual Studio Build Tools để có `link.exe`:

1. Tải installer: [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Chạy installer → chọn workload **"Desktop development with C++"** hoặc ít nhất:

   * MSVC (Ví dụ: "MSVC v143 - VS 2022 C++ build tools")
   * Windows 10/11 SDK
3. Cài xong → restart máy (hoặc ít nhất mở terminal mới)

> Thay thế nhẹ hơn (không khuyến nghị): thay sang GNU toolchain với `rustup toolchain install stable-gnu` rồi `rustup default stable-gnu`. Một số crate/biến thể có thể không hoạt động hoàn hảo với GNU trên Windows.

### C. Thêm target WASM

```powershell
rustup target add wasm32-unknown-unknown
```

### D. Cài `wasm-pack`

Có hai cách:

* Bằng cargo (từ source):

```powershell
cargo install wasm-pack
```

* Hoặc nhanh bằng npm (cài sẵn binary wrapper):

```powershell
npm install -g wasm-pack
```

Kiểm tra:

```powershell
wasm-pack --version
```

---

# 4) Tạo crate Rust (WASM library)

Tạo cấu trúc project:

```
/project-root
  /rust_wasm_math   # crate Rust
  /my-vite-app      # ứng dụng React (Vite)
```

Tạo crate:

```powershell
cd D:\working\react_rust
cargo new --lib rust_wasm_math
cd rust_wasm_math
```

Chỉnh `Cargo.toml` (min):

```toml
[package]
name = "rust_wasm_math"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

Giải thích: `cdylib` + `wasm-bindgen` là combo phổ biến để export hàm cho JS.

---

# 5) Viết code Rust (ví dụ counter + calculator)

File: `rust_wasm_math/src/lib.rs`

```rust
use wasm_bindgen::prelude::*;

// Counter (lưu trong static, ví dụ đơn giản)
static mut COUNTER: i32 = 0;

#[wasm_bindgen]
pub fn click_counter() -> i32 {
    unsafe {
        COUNTER += 1;
        COUNTER
    }
}

#[wasm_bindgen]
pub fn reset_counter() {
    unsafe { COUNTER = 0; }
}

// Calculator (dùng f64 cho số thực)
#[wasm_bindgen]
pub fn add(a: f64, b: f64) -> f64 { a + b }

#[wasm_bindgen]
pub fn sub(a: f64, b: f64) -> f64 { a - b }

#[wasm_bindgen]
pub fn mul(a: f64, b: f64) -> f64 { a * b }

#[wasm_bindgen]
pub fn div(a: f64, b: f64) -> f64 {
    if b == 0.0 { f64::NAN } else { a / b }
}

#[wasm_bindgen]
pub fn reset_value() -> f64 { 0.0 }

// Ví dụ trả chuỗi
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

Giải thích ngắn:

* `#[wasm_bindgen]` cho phép hàm được export và JS có thể gọi trực tiếp.
* Số và string được tự động marshal giữa Rust ↔ JS.
* Những kiểu phức tạp hơn (structs, arrays lớn) cần `JsValue`/`serde-wasm-bindgen`.

---

# 6) Build thành WebAssembly bằng `wasm-pack`

Từ thư mục crate (`rust_wasm_math`):

```powershell
# build cho chạy trực tiếp trong browser rồi copy sang public/
wasm-pack build --target web --release --out-dir ../my-vite-app/public/wasm

# hoặc (nếu muốn bundler-friendly, import trực tiếp bằng bundler),
# từ crate:
wasm-pack build --target bundler --release --out-dir ../my-vite-app/pkg
```

Kết quả (`--target web`) tạo ra folder `public/wasm` chứa: `rust_wasm_math.js`, `rust_wasm_math_bg.wasm`, typings `*.d.ts`, `package.json`.

**Lưu ý chọn target**:

* `--target web`: JS wrapper load `.wasm` bằng `fetch` — phù hợp khi bạn copy `pkg` vào `public/` và dùng dynamic import `/wasm/...`.
* `--target bundler`: wrapper phù hợp cho bundler (Vite/Rollup/Webpack) — bạn có thể `import init, { add } from 'your-pkg'`.

Nếu bạn dùng `wasm-pack` lần đầu, có thể thấy thông báo về `wasm-opt` — đây là công cụ tối ưu `.wasm` nhưng không bắt buộc.

---

# 7) Cách nhúng vào React (3 workflow)

## A — `--target web` (ĐƠN GIẢN, phù hợp cho người mới)

1. Build: `wasm-pack build --target web --out-dir ../my-vite-app/public/wasm`
2. Trong React: dynamic import file JS wrapper từ `public`:

```tsx
// src/components/WasmCalculator.tsx (TypeScript)
import React, { useEffect, useState } from 'react';

export default function WasmCalculator() {
  const [mod, setMod] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await import('/wasm/rust_wasm_math.js'); // đường dẫn từ public/
      await m.default(); // gọi init
      setMod(m);
      setReady(true);
    })();
  }, []);

  // dùng mod.add, mod.click_counter, ...
  return <div>{ready ? 'WASM ready' : 'Loading...'}</div>;
}
```

**Ưu điểm:** đơn giản, không cần bundler config

**Nhược điểm:** không được tree-shake, import đường dẫn cố định `/wasm/...`.

## B — `--target bundler` (tốt cho project thật, import như npm package)

1. Build: `wasm-pack build --target bundler --out-dir ../my-vite-app/pkg`
2. Trong `my-vite-app`, cài package local:

```bash
cd ../my-vite-app
npm install ../rust_wasm_math/pkg
```

3. Trong React:

```js
import init, { add, click_counter } from 'rust_wasm_math';

useEffect(() => {
  (async () => {
    await init();
    // ready
  })();
}, []);
```

**Ưu điểm:** tích hợp tốt với bundler, dễ deploy, có thể tree-shake

**Nhược điểm:** cần bước `npm install ../pkg` hoặc publish lên registry.

## C — Import trực tiếp từ `pkg` trong source (local link)

Bạn có thể `npm link` hoặc thêm `file:../rust_wasm_math/pkg` vào `package.json` dependencies.

---

# 8) Ví dụ component React (đầy đủ)

### A) Dùng `--target web` (dynamic import) — JavaScript (Vite)

`src/App.jsx`:

```jsx
import React, { useEffect, useState } from 'react';

export default function App() {
  const [mod, setMod] = useState(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [res, setRes] = useState(null);

  useEffect(() => {
    (async () => {
      const m = await import('/wasm/rust_wasm_math.js');
      await m.default();
      setMod(m);
      setReady(true);
    })();
  }, []);

  const inc = () => { if (mod) setCount(mod.click_counter()); };
  const resetCounter = () => { if (mod) { mod.reset_counter(); setCount(0); } };
  const operate = (op) => {
    if (!mod) return;
    const x = Number(a); const y = Number(b);
    if (Number.isNaN(x) || Number.isNaN(y)) { setRes('Invalid'); return; }
    let r;
    switch(op){ case '+': r = mod.add(x,y); break; case '-': r = mod.sub(x,y); break; case '*': r = mod.mul(x,y); break; case '/': r = mod.div(x,y); break; }
    setRes(Number.isNaN(r) ? 'Error (div by 0?)' : r);
  }

  if (!ready) return <div>Loading WASM...</div>;

  return (
    <div>
      <h3>Counter</h3>
      <button onClick={inc}>Click me ({count})</button>
      <button onClick={resetCounter}>Reset</button>

      <h3>Calculator</h3>
      <input value={a} onChange={e=>setA(e.target.value)} placeholder="a" />
      <input value={b} onChange={e=>setB(e.target.value)} placeholder="b" />
      <div>
        <button onClick={()=>operate('+')}>+</button>
        <button onClick={()=>operate('-')}>-</button>
        <button onClick={()=>operate('*')}>*</button>
        <button onClick={()=>operate('/')}>/</button>
        <button onClick={() => { mod.reset_value(); setRes(0); setA(''); setB(''); }}>Reset</button>
      </div>
      <div>Result: {res}</div>
    </div>
  );
}
```

### B) Dùng `--target bundler` (import as package) — TypeScript

`src/App.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import init, { add, sub, mul, div, click_counter, reset_counter } from 'rust_wasm_math';

export default function App() {
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [res, setRes] = useState<number | null>(null);

  useEffect(() => {
    (async () => { await init(); setReady(true); })();
  }, []);

  if (!ready) return <div>Loading WASM...</div>;

  return (
    <div>
      {/* similar UI as above, call add/sub/mul/div/click_counter */}
    </div>
  );
}
```

> Với `--target bundler`, bạn import `init` làm hàm khởi tạo và các hàm được export như named exports.

---

# 9) Dev workflow & tự động rebuild

**Manual (cơ bản)**

* Mỗi lần sửa Rust, chạy:

  ```powershell
  cd rust_wasm_math
  wasm-pack build --target web --out-dir ../my-vite-app/public/wasm
  # rồi refresh trình duyệt
  ```

**Tự động**

* Cài `cargo-watch` để auto build khi sửa code:

  ```powershell
  cargo install cargo-watch
  cargo watch -s "wasm-pack build --target web --out-dir ../my-vite-app/public/wasm"
  ```
* Hoặc tạo 1 script PowerShell (Windows) hoặc bash script kết hợp `npm run dev`.

**Ví dụ script PowerShell đơn giản:**

```powershell
# build-and-dev.ps1 (chạy từ project-root)
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd .\rust_wasm_math ; cargo watch -s 'wasm-pack build --target web --out-dir ..\my-vite-app\public\wasm'"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd .\my-vite-app ; npm run dev"
```

---

# 10) Build production & deploy

1. Build wasm release: `wasm-pack build --target web --release --out-dir ../my-vite-app/public/wasm`
2. Build React: `cd ../my-vite-app && npm run build`

> Vì Vite copy `public/` vào `dist`, bạn **phải** build wasm trước khi `npm run build`.

---

# 11) Troubleshooting (lỗi thường gặp & cách fix)

* **`link.exe failed` / lỗi khi `cargo install` hoặc build**

  * Nguyên nhân: thiếu Visual Studio Build Tools (MSVC). Fix: cài "Desktop development with C++" + Windows SDK.

* **`cargo: command not found`**

  * Đóng & mở lại terminal hoặc thêm `C:\Users\<User>\\.cargo\\bin` vào PATH.

* **`wasm-pack` không tồn tại**

  * Cài `cargo install wasm-pack` hoặc `npm i -g wasm-pack`, đảm bảo đường dẫn `~/.cargo/bin` hoặc npm global bin có trong PATH.

* **Import `/wasm/rust_wasm_math.js` 404**

  * Kiểm tra `my-vite-app/public/wasm` có file `rust_wasm_math.js` và `*_bg.wasm`.
  * Đảm bảo dev server đang chạy và không có base path khác.

* **`mod.default is not a function` / `init is not defined`**

  * Kiểm tra bạn dùng `--target web` hay `--target bundler`:

    * `--target web`: import dynamic `import('/wasm/rust_wasm_math.js')` và gọi `await mod.default()`.
    * `--target bundler`: import `init` và gọi `await init()`.

* **Chia cho 0 -> trả NaN**

  * Rust trả `f64::NAN`. Ở React kiểm tra `Number.isNaN(result)` để hiển thị lỗi thân thiện.

* **`wasm-opt` missing**

  * Thông báo chỉ cho biết `wasm-opt` (từ Binaryen) không có, build vẫn tiếp tục. Cài Binaryen nếu muốn tối ưu: cài `wasm-opt` qua choco/scoop hoặc tải binary từ repo Binaryen.

* **Truyền dữ liệu phức tạp**

  * Dùng `JsValue` và `serde-wasm-bindgen` để serialize/deserialize JSON giữa Rust và JS.

* **Nếu bạn thấy file `.wasm` lớn**

  * Sử dụng `wasm-opt -Oz` để tối ưu size (Binaryen), hoặc chuyển bỏ dependency nặng.

---

# 12) Ghi chú về kiểu dữ liệu, hiệu năng và bảo mật

* **Kiểu dữ liệu**: primitives (số, chuỗi) dễ chuyển; `struct`, `Vec` hay object dùng `JsValue` hoặc `serde-wasm-bindgen`.
* **Hiệu năng**: lợi nhất cho logic nặng (crypto, xử lý ảnh, thuật toán). Gọi hàm rất nhanh nhưng có chi phí crossing boundary JS↔WASM nếu gọi quá thường xuyên với data nhỏ.
* **Bảo mật / reverse-engineering**: WASM khó đọc hơn JS nhưng vẫn có thể reverse-engineer bằng tools; không dùng WASM làm nơi lưu secrets.

---

# 13) Appendix — lệnh & script nhanh

**Lệnh nhanh thiết lập (Windows PowerShell):**

```powershell
# 1) cài rustup (nếu chưa)
winget install Rustlang.Rustup

# 2) thêm target wasm
rustup target add wasm32-unknown-unknown

# 3) cài wasm-pack (nếu muốn bằng cargo hoặc npm)
cargo install wasm-pack
# hoặc
npm i -g wasm-pack

# 4) build wasm (web target)
cd rust_wasm_math
wasm-pack build --target web --release --out-dir ../my-vite-app/public/wasm

# 5) chạy vite
cd ../my-vite-app
npm install
npm run dev
```

**package.json scripts (trong my-vite-app) — ví dụ tự động build wasm rồi start:**

```json
{
  "scripts": {
    "build:wasm": "(cd ../rust_wasm_math && wasm-pack build --target web --release --out-dir ./public/wasm)",
    "dev": "npm run build:wasm && vite",
    "start": "npm run dev",
    "build": "npm run build:wasm && vite build"
  }
}
```

> Lưu ý: đường dẫn `../rust_wasm_math` giả định cấu trúc như trên; chỉnh theo repo của bạn.

---

## Muốn mình tùy chỉnh thêm?

Nếu bạn muốn mình sửa tài liệu để:

* Thêm phần hướng dẫn **bằng hình** (screenshot) cho từng bước cài đặt trên Windows,
* Viết sẵn `Cargo.toml` + toàn bộ `src/lib.rs` final để copy/paste,
* Viết script PowerShell hoàn chỉnh cho dev loop (tự động rebuild wasm + start vite),

hãy nói phần bạn muốn mình thêm — mình sẽ cập nhật ngay trong tài liệu này.

---

Chúc bạn build vui! 🚀
