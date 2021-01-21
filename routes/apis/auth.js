const express = require('express')
const router = express.Router()
const User = require('../../Models/User')
const authMiddleware = require('../../middleware/authMiddleware')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// @Route   GET /api/auth
// @Desc   Get Current User
// @Access  PUBLIC
router.get('/', authMiddleware, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        return res.json(user)
    } catch (error) {
        console.error(error)
        return res.status(500).send('Server Error')
    }
})

// @Route   POST /api/auth
// @Desc    login Users
// @Access  PUBLIC
router.post(
    '/', [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter password').exists(),
    ],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { email, password } = req.body

        try {
            let user = await User.findOne({ email })
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'User not found' }] })
            }

            const isMatch = bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Password doen't match" }] })
            }

            const payload = {
                user: {
                    id: user.id,
                },
            }
            jwt.sign(
                payload,
                process.env.jwtSecret, { expiresIn: 36000 },
                (err, token) => {
                    if (err) throw err
                    res.json({ token })
                }
            )
        } catch (err) {
            console.error(err.message)
            res.status(500).send('Server error')
        }
    }
)

module.exports = router