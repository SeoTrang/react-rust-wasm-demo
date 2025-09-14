use wasm_bindgen::prelude::*;

// simple counter
#[wasm_bindgen]
pub fn increment(count: i32) -> i32 {
    count + 1
}

#[wasm_bindgen]
pub fn reset_count() -> i32 {
    0
}

// calculator (use f64 để hỗ trợ số thực)
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

// ví dụ truyền chuỗi (wasm-bindgen tự marshal string cho bạn)
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
