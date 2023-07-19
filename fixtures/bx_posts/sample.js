module.exports = {
    "uri": "view-post/sample",
    "data": [
        { name: "title", val: "Sample" },
        { name: "cat", select: 3 }, // Art
        { name: "text", val: "<p>Sample content</p><p>new line</p>", "eval": true }, // eval is needed to force set value to invisible element
    ],
    "cover": "fixtures/bx_posts/sample_cover.jpg",
    "photo_attachment": "fixtures/bx_posts/sample_attachment.jpg",
}