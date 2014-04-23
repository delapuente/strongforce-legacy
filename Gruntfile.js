module.exports = function(grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var srcFiles = [
    '<%= dirs.src %>/_intro.js',
    '<%= dirs.src %>/strongforce.js',
    '<%= dirs.src %>/Loop.js',
    '<%= dirs.src %>/EventEmitter.js',
    '<%= dirs.src %>/Render.js',
    '<%= dirs.src %>/Simulator.js',
    '<%= dirs.src %>/Model.js',
    '<%= dirs.src %>/_outro.js'
  ];

  var demoSrcFiles = [
    '<%= dirs.demoScripts %>/**/*.js'
  ];

  var specFiles = [
    '<%= dirs.test %>/spec/**/*.js'
  ];

  var banner = [
    '/**',
    ' * @license',
    ' * <%= pkg.name %> - v<%= pkg.version %>',
    ' * Copyright (c) 2014, Salvador de la Puente',
    ' * <%= pkg.homepage %>',
    ' *',
    ' * Compiled: <%= grunt.template.today("yyyy-mm-dd") %>',
    ' *',
    ' * <%= pkg.name %> is licensed under the <%= pkg.license %> License.',
    ' * <%= pkg.licenseUrl %>',
    ' */',
    ''
  ].join('\n');

  grunt.initConfig({

    dirs: {
      src: 'src',
      build: 'dist',
      demo: 'demo',
      demoScripts: '<%= dirs.demo %>/scripts',
      demoLib: '<%= dirs.demo %>/lib',
      docs: 'docs',
      test: 'test',
      spec: '<%= dirs.test %>/spec'
    },

    files: {
      build: '<%= dirs.build %>/<%= pkg.name %>.js',
      buildDev: '<%= dirs.build %>/<%= pkg.name %>.js',
      buildMin: '<%= dirs.build %>/<%= pkg.name %>.min.js'
    },

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n'
      },
      dist: {
        src: srcFiles,
        dest: '<%= files.build %>'
      }
    },

    /* jshint -W106 */
    concat_sourcemap: {
      dev: {
        files: {
          '<%= files.buildDev %>': srcFiles
        },
        options: {
          sourceRoot: '../'
        }
      }
    },

    uglify: {
      options: {
        banner: banner
      },
      dist: {
        files: {
          '<%= files.buildMin %>': ['<%= concat.dist.dest %>']
        }
      }
    },

    jshint: {
      files: srcFiles
             .concat(demoSrcFiles)
             .concat(specFiles)
             .concat('Gruntfile.js'),
      options: {
        ignores: [
          'src/{_intro,_outro,strongforce}.js',
          '<%= dirs.demoLib %>/**/*'
        ],
        globals: {
          console: true,
          module: true,
          document: true,
          strongforce: false
        },
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint']
      },
      test: {
        files: ['<%= dirs.spec %>/**/*.js'],
        tasks: ['connect:test', 'mocha']
      }
    },

    // Shell commands
    shell: {
      hooks: {
        command: 'cp git-hooks/pre-commit .git/hooks/ && ' +
                 'chmod +x .git/hooks/pre-commit'
      }
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: '<%= dirs.src %>',
          outdir: '<%= dirs.docs %>'
        }
      }
    },

    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // Change this to '0.0.0.0' to access the server from outside
        hostname: '0.0.0.0',
        open: {
          appName: 'google-chrome-stable'
        }
      },
      test: {
        options: {
          open: false,
          port: 9001,
          middleware: function(connect) {
            return [
              connect().use('/dist', connect.static('dist')),
              connect().use('/src', connect.static('src')),
              connect.static('test')
            ];
          }
        }
      }
    },

    // Mocha testing framework configuration options
    mocha: {
      all: {
        options: {
          run: true,
          urls: [
            'http://<%= connect.test.options.hostname %>:' +
            '<%= connect.test.options.port %>/index.html'
          ]
        }
      }
    },

  });

  grunt.registerTask('hookmeup', ['shell:hooks']);
  grunt.registerTask('docs', ['yuidoc']);
  grunt.registerTask('test',
    ['jshint', 'concat_sourcemap', 'connect:test', 'mocha']);
  grunt.registerTask('dist', ['jshint', 'concat', 'uglify', 'docs']);
  grunt.registerTask('default',
   ['jshint', 'concat_sourcemap', 'connect:test', 'mocha']);

};
