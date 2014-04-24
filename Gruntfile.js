module.exports = function(grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var srcFiles = [
    '<%= dirs.src %>/strongforce.js',
    '<%= dirs.src %>/Loop.js',
    '<%= dirs.src %>/EventEmitter.js',
    '<%= dirs.src %>/Render.js',
    '<%= dirs.src %>/Simulator.js',
    '<%= dirs.src %>/Model.js'
  ];

  var demoSrcFiles = [
    '<%= dirs.demo %>/scripts/**/*.js'
  ];

  var specFiles = [
    '<%= dirs.test %>/spec/**/*.js'
  ];

  var banner = [
    '/**',
    ' * @license',
    ' * <%= libname %> - v<%= pkg.version %>',
    ' * Copyright (c) 2014, Salvador de la Puente',
    ' * <%= pkg.homepage %>',
    ' *',
    ' * Compiled: <%= grunt.template.today("yyyy-mm-dd") %>',
    ' *',
    ' * <%= libname %> is licensed under the <%= pkg.license %> License.',
    ' * <%= pkg.licenseUrl %>',
    ' */',
    ''
  ].join('\n');

  grunt.initConfig({

    libname: '<%= pkg.name %>',

    dirs: {
      src: 'src',
      bin: 'dist',
      build: 'build',
      demo: 'demo',
      docs: 'docs',
      test: 'test',
      spec: '<%= dirs.test %>/spec',
      tmp: '.tmp'
    },

    files: {
      build: '<%= dirs.bin %>/<%= libname %>.js',
      buildMin: '<%= dirs.bin %>/<%= libname %>.min.js',
      preBuild: '<%= dirs.tmp %>/<%= libname %>.js',
      intro: '<%= dirs.build %>/_intro.js',
      outro: '<%= dirs.build %>/_outro.js'
    },

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        src: [
          '<%= files.intro %>',
          '<%= files.preBuild %>',
          '<%= files.outro %>'
        ],
        dest: '<%= files.build %>',
        options: { process: true }
      }
    },

    copy: {
      dist: {
        expand: true,
        cwd: '<%= dirs.tmp %>',
        src: '*.map',
        dest: '<%= dirs.bin %>/',
        options: {
          process: function (content) {
            var target = '"mappings": "';
            var offset = 46;
            var padding = new Array(offset + 1).join(';');
            return content.replace(target, target + padding);
          }
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
          'src/{_intro,_outro,strongforce}.js'
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
        name: '<%= libname %>',
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

    requirejs: {
      dist: {
        options: {
          optimize: 'none',
          baseUrl: 'src',
          name: '<%= libname %>',
          out: '<%= files.preBuild %>',
          useStrict: true,
          generateSourceMaps: true
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
    ['jshint', 'connect:test', 'mocha']);
  grunt.registerTask('dist', ['jshint', 'concat', 'uglify', 'docs']);
  grunt.registerTask('default',
   ['jshint', 'connect:test', 'mocha']);

};
