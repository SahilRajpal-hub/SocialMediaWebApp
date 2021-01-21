const express = require('express')
const router = express.Router()
const auth = require('../../middleware/authMiddleware')
const { check, validationResult } = require('express-validator')
const User = require('../../Models/User')
const Profile = require('../../Models/Profile')
const Post = require('../../Models/Post')

// @Route   POST /api/post
// @Desc    Create a Post
// @Access  PRIVATE
router.post(
    '/', [auth, [check('text', 'Text is required').not().isEmpty()]],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        try {
            const user = await User.findById(req.user.id).select('-password')
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            })

            const post = await newPost.save()
            res.json(post)
        } catch (err) {
            console.log(err.message)
            res.status(500).send('Server error')
        }
    }
)

// @Route   GET /api/post
// @Desc    get all posts
// @Access  PRIVATE
router.get('/', auth, async(req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 })
        res.json(posts)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   GET /api/post/:id
// @Desc    get post by id
// @Access  PRIVATE
router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ msg: 'Post not found' })
        res.json(post)
    } catch (err) {
        console.log(err.message)
        if (err.kind === 'ObjectId')
            return res.status(404).json({ msg: 'Post not found' })
        res.status(500).send('Server error')
    }
})

// @Route   Delete /api/post/:id
// @Desc    delete post by id
// @Access  PRIVATE
router.delete('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ msg: 'Post not found' })

        //check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not Authorized' })
        }

        await post.remove()
        res.json({ msg: 'Post Removed' })
    } catch (err) {
        console.log(err.message)
        if (err.kind === 'ObjectId')
            return res.status(404).json({ msg: 'Post not found' })
        res.status(500).send('Server error')
    }
})

// @Route   Delete /api/post/like/:id
// @Desc    like post by id
// @Access  PRIVATE
router.get('/like/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        //check if user has already liked the post then unlike it
        var removeIndex = -1
        post.likes.map((like) => {
            if (like.user.toString() === req.user.id) {
                removeIndex = post.likes.indexOf(like)
            }
        })
        if (removeIndex !== -1) {
            post.likes.splice(removeIndex, 1)
            await post.save()
            return res.json(post.likes)
        }

        //else like the post
        post.likes.unshift({ user: req.user.id })
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   POST /api/post/comment/:id
// @Desc    Comment on Post
// @Access  PRIVATE
router.post(
    '/comment/:id', [auth, [check('text', 'Text is required').not().isEmpty()]],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        try {
            const user = await User.findById(req.user.id).select('-password')
            const post = await Post.findById(req.params.id)
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            }
            post.comment.unshift(newComment)
            await post.save()
            res.json(post.comment)
        } catch (err) {
            console.log(err.message)
            res.status(500).send('Server error')
        }
    }
)

// @Route   DELETE /api/post/comment/:id/:comment_id
// @Desc    Delete a comment on Post
// @Access  PRIVATE
router.delete('/comment/:id/:comment_id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        //pull out the comment
        const comment = post.comment.find(
            (comment) => comment.id === req.params.comment_id
        )

        //make sure comment exist
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' })
        }

        //check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' })
        }

        const removeIndex = post.comment
            .map((comment) => comment.id)
            .indexOf(req.params.comment_id)
        post.comment.splice(removeIndex, 1)
        await post.save()
        return res.json(post.comment)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

module.exports = router