const { AuthenticationError } = require('apollo-server-express');
const { User, Post, Comment} = require('../models');
const { signToken } = require('../utils/auth');


const resolvers = {
  Query: {
    posts: async () => {
      return await Post.find();
    },
    comments: async (parent, { post, id }) => {
      const params = {};

      if (post) {
        params.post = post;
      }

      if (id) {
        params.id = {
          $regex: id
        };
      }

      return await Comments.find(params).populate('post');
    },
    user: async (parent, args, context) => {
      if (context.user) {
        const user = await User.findById(context.user._id).populate({
          path: 'orders.products',
          populate: 'category'
        });

        return user;
      }

      throw new AuthenticationError('Not logged in');
    },
    // order: async (parent, { _id }, context) => {
    //   if (context.user) {
    //     const user = await User.findById(context.user._id).populate({
    //       path: 'orders.products',
    //       populate: 'category'
    //     });

    //     return user.orders.id(_id);
    //   }

    //   throw new AuthenticationError('Not logged in');
    // },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    addPost: async (parent, {posts},context) => {
      console.log(context);
      if (context.user) {
        const post = new Post({ posts });

        await User.findByIdAndUpdate(context.user._id, { $push: { posts: post } });

        return post;
      }

      throw new AuthenticationError('Not logged in');
    },
    updateUser: async (parent, args, context) => {
      if (context.user) {
        return await User.findByIdAndUpdate(context.user._id, args, { new: true });
      }

      throw new AuthenticationError('Not logged in');
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    }
  }
};

module.exports = resolvers;
