const express = require("express");
const request = require("request");
const config = require("config");

const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({
        user: req.user.id
      }).populate('user', ['name', 'avatar']);
  
      if (!profile) {
        return res.status(400).json({ msg: 'There is no profile for this user' });
      }
  
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

//@route  POST api/profile
//desc    create or update user
//access  private 

router.post('/',[auth, [
    check('status','Status is Required')
    .not()
    .isEmpty(),
    check('skills','Skills is Required')
    .not()
    .isEmpty()
    ]
 ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {
        company,
        location,
        website,
        bio,
        skills,
        status,
        githubusername,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
      } = req.body;

      //Build profile object
      const profileFields = {};
      profileFields.user = req.user.id;
      if(company) profileFields.company=company;
      if(website) profileFields.website=website;
      if(location) profileFields.location=location;
      if(bio) profileFields.bio=bio;
      if(status) profileFields.status=status;
      if(githubusername) profileFields.githubusername=githubusername;
      if(skills){
          profileFields.skills = skills.split(',').map(skill => skill.trim());
      }    
      
      //Build social object
      profileFields.social = {}
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;
      
      try{
        let profile = Profile.findOne({ user: req.user.id});

        if(profile){
            //Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true }
              );
            
            return res.json(profile);
        }

        //create
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
      }
      catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }   
      
    }   
);

//@route  GET api/profile
//desc    Get all profile
//access  public

router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

//@route  GET api/profile/user/:user_id
//desc    Get profile by user ID
//access  public

router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);
        
        if(!profile) return res.status(400).json({msg: 'Profile not found' }
    );
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind== 'ObjectId') {
            return res.status(400).json({msg: 'Profile not found' }
        );      
        }
        res.status(500).send('Server Error');
    
    }
});


//@route  DELETE api/profile
//desc    Delete profile,user &posts
//access  private

router.delete('/',auth, async (req,res) => {
    try {
        //Remove posts
        await Post.deleteMany({ user: req.user.id});
       //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id});
        //Remove user
        await Profile.findOneAndRemove({ _id: req.user.id});
       
        res.json({msg: 'User Deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    
    }
});

//@route  PUT api/profile/experience
//desc    Add profile experience
//access  private

router.put('/experience',
[
    auth,
    [
        check('title', 'Title is required')
        .not()
        .isEmpty(),
        check('company', 'Company is required')
        .not()
        .isEmpty(),
        check('from', 'From date is required')
        .not()
        .isEmpty(),
    ]
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array() });

        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } =req.body;
        
        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id});

            profile.experience.unshift(newExp);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        
        }
    }
);

//@route  DELETE api/profile/experience/:exp_id
//desc    Delete profile experience
//access  private
router.delete('/experience/:exp_id', auth ,async(req , res) =>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });

    profile.experience = profile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );
        

       
        await profile.save();
       
        res.json(profile);
    } catch (err) {
        console.error(err.message);
            res.status(500).send('Server Error');
    }
});


//@route  PUT api/profile/education
//desc    Add profile education
//access  private

router.put('/education',
[
    auth,
    [
        check('school', 'School is required')
        .not()
        .isEmpty(),
        check('degree', 'Degree is required')
        .not()
        .isEmpty(),
        check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
    ]
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array() });

        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } =req.body;
        
        const newEdu= {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id});

            profile.education.unshift(newEdu);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        
        }
    }
);

//@route  DELETE api/profile/education/:edu_id
//desc    Delete profile education
//access  private
router.delete('/education/:edu_id', auth ,async(req , res) =>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });

    profile.education = profile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );
        

       
        await profile.save();
       
        res.json(profile);
    } catch (err) {
        console.error(err.message);
            res.status(500).send('Server Error');
    }
});

//@route  GET api/profile/github/:username
//desc    Get user repos from github
//access  public

router.get('/github/:username', async (req,res) => {
    try {
        const options = {
            uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent' : 'node.js'}
        };

        request(options, (error , response , body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No github profile'});
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
            res.status(500).send('Server Error');
        
    }
});
module.exports = router;