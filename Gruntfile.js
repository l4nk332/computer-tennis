module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

    grunt.initConfig({
    	  watch: {
    	    default: {
    		files: ['./public/scripts/game.js'],
    		tasks: ['babel']
    	    }
      	},
      	"babel": {
      	    options: {
      		      sourceMap: true,
      		      presets: ['es2015']
      	    },
      	    dist: {
        		  files: {
        		    "./public/scripts/trans-pong.js": "./public/scripts/game.js"
        		  }
      	    }
      	}
    });
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", ["babel"]);
};
