#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "Fibonacci(30) Benchmark - PyFree vs Python vs Node.js"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Warm up
node dist/index.js benchmark/fibonacci.pf > /dev/null 2>&1
python3 benchmark/fibonacci.py > /dev/null 2>&1
node benchmark/fibonacci.js > /dev/null 2>&1

echo "Test 1: PyFree"
time -p node dist/index.js benchmark/fibonacci.pf
echo ""

echo "Test 2: Python 3"
time -p python3 benchmark/fibonacci.py
echo ""

echo "Test 3: Node.js"
time -p node benchmark/fibonacci.js
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "Benchmark Results Summary"
echo "═══════════════════════════════════════════════════════════"
