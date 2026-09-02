const { fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: "Chatbots we test for Russian disinformation",
    description: (data) =>
      fitDescription(
        [
          `One page per chatbot: how each of the ${data.profiles.chatbots.length} products we test handled documented false claims about Ukraine.`,
          "Which claims it repeated,",
          "and every report we sent to its maker.",
          "Open data."
        ],
        "/platforms/"
      )
  }
};
