const express = require('express')
const router = express.Router()
const request = require('request')
const auth = require('../../middleware/authMiddleware')
const Profile = require('../../Models/Profile')
const User = require('../../Models/User')
const { check, validationResult } = require('express-validator')

// @Route   GET /api/profile/me
// @Desc    Get current user profile
// @Access  Private
router.get('/me', auth, async(req, res) => {
    try {
        console.log(req.user)
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar'])
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }
        res.json(profile)
    } catch (err) {
        console.error(error)
        res.status(500).send('Server error')
    }
})

// @Route   POST /api/profile
// @Desc    Create/Update User Profile
// @Access  Private
router.post(
    '/', [
        auth, [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ],
    ],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: errors.array() })
        }
        const {
            skills,
            status,
            company,
            website,
            location,
            bio,
            githubusername,
            facebook,
            linkedin,
            twitter,
            instagram,
            youtube,
        } = req.body

        //build profile fields
        const profileFields = {}
        profileFields.user = req.user.id
        if (company) profileFields.company = company
        if (location) profileFields.location = location
        if (website) profileFields.website = website
        if (bio) profileFields.bio = bio
        if (status) profileFields.status = status
        if (githubusername) profileFields.githubusername = githubusername
        if (skills) {
            profileFields.skills = skills.split(',').map((skill) => skill.trim())
        }

        // Build Social Fields
        profileFields.social = {}
        if (facebook) profileFields.social.facebook = facebook
        if (twitter) profileFields.social.twitter = twitter
        if (instagram) profileFields.social.instagram = instagram
        if (youtube) profileFields.social.youtube = youtube
        if (linkedin) profileFields.social.linkedin = linkedin

        try {
            let profile = await Profile.findOne({ user: req.user.id })

            if (profile) {
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
                return res.json(profile)
            }

            //Create
            profile = new Profile(profileFields)
            await profile.save()
            res.json(profile)
        } catch (err) {
            console.error(err.message)
            res.status(500).send('Server Error')
        }
    }
)

// @Route   GET /api/profile
// @Desc    Gives all the profiles
// @Access  Public
router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   GET /api/profile/user/:user_id
// @Desc    Get profile by id
// @Access  Public
router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate('user', ['name', 'avatar'])
        if (!profile) {
            return res.status(400).json({ msg: 'Profile Not Found' })
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile Not Found' })
        }
        res.status(500).send('Server error')
    }
})

// @Route   DELETE /api/profile
// @Desc    Delete profile, User & Posts
// @Access  Private
router.delete('/', auth, async(req, res) => {
    try {
        // @todo delete posts

        // remove profile
        await Profile.findOneAndDelete({
            user: req.user.id,
        })

        // remove user
        await User.findOneAndDelete({
            _id: req.user.id,
        })

        res.json({ msg: 'User Deleted SuccessFully' })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   PUT /api/profile/experience
// @Desc    Add user experience
// @Access  Private
router.put(
    '/experience', [
        auth, [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty(),
        ],
    ],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        } = req.body

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.experience.unshift(newExp)
            await profile.save()
            res.json(profile)
        } catch (error) {
            console.log(error.message)
            res.status(500).send('Server error')
        }
    }
)

// @Route   DELETE /api/profile/experience/:exp_id
// @Desc    Delete user experience
// @Access  Private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   PUT /api/profile/education
// @Desc    Add user education
// @Access  Private
router.put(
    '/education', [
        auth, [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty(),
        ],
    ],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        } = req.body

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.education.unshift(newEdu)
            await profile.save()
            res.json(profile)
        } catch (error) {
            console.log(error.message)
            res.status(500).send('Server error')
        }
    }
)

// @Route   DELETE /api/profile/experience/:exp_id
// @Desc    Delete user experience
// @Access  Private
router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        const removeIndex = profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

// @Route   GET /api/profile/github/:username
// @Desc    Get users repo from github
// @Access  Public
router.get('/github/:username', async(req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc
            &client_id=${process.env.githubClientId}&client_secret=${process.env.githubSecret}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' },
        }

        request(options, (error, response, body) => {
            if (error) console.log(error)

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github Profile Found' })
            }
            res.json(JSON.parse(body))
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error')
    }
})

module.exports = router