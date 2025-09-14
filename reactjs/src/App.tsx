import { useEffect, useState } from "react"
import init, { increment, reset_count, add, sub, mul, div, reset_value } from "rust_wasm_math"
import "./App.css"

function App() {
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(0)
  const [a, setA] = useState("")
  const [b, setB] = useState("")
  const [result, setResult] = useState<number | string>("")

  useEffect(() => {
    (async () => {
      await init()
      setReady(true)
    })()
  }, [])

  const inc = () => setCount(increment(count))
  const resetCounter = () => setCount(reset_count())

  const calculate = (op: string) => {
    const x = Number(a)
    const y = Number(b)
    if (Number.isNaN(x) || Number.isNaN(y)) {
      setResult("Invalid input")
      return
    }
    let r
    switch (op) {
      case "+": r = add(x, y); break
      case "-": r = sub(x, y); break
      case "*": r = mul(x, y); break
      case "/": r = div(x, y); break
      default: r = "Unknown op"
    }
    setResult(r)
  }

  const resetCalc = () => {
    setA("")
    setB("")
    setResult(reset_value())
  }

  if (!ready) return <div className="loading">Loading WASM...</div>

  return (
    <div className="container">
      <h1>Rust + React + WASM</h1>

      {/* Counter Section */}
      <div className="card">
        <h2>Counter</h2>
        <button onClick={inc}>Click count (Rust): {count}</button>
        <button onClick={resetCounter} className="reset">Reset</button>
      </div>

      {/* Calculator Section */}
      <div className="card">
        <h2>Calculator</h2>
        <div className="inputs">
          <input value={a} onChange={e => setA(e.target.value)} placeholder="a" />
          <input value={b} onChange={e => setB(e.target.value)} placeholder="b" />
        </div>
        <div className="buttons">
          <button onClick={() => calculate("+")}>+</button>
          <button onClick={() => calculate("-")}>-</button>
          <button onClick={() => calculate("*")}>*</button>
          <button onClick={() => calculate("/")}>/</button>
        </div>
        <p className="result">Result: {result}</p>
        <button onClick={resetCalc} className="reset">Reset Calculator</button>
      </div>
    </div>
  )
}

export default App
