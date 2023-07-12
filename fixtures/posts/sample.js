module.exports = {
    "data": [
        { name: "title", val: "Test post" },
        { name: "cat", select: 3 },
        { name: "text", val: "Test content", "eval": true }, // eval is needed to force set value to invisible element
    ],
    "cover": "fixtures/posts/sample.jpg",
}