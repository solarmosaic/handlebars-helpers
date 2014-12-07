var _ = require("lodash");
var matter = require("gray-matter");
var optional = require("optional");
var path = require("path");

/**
 * Creates a tailored partial helper register function.
 *
 * @param {String} options.base The base path to the partials directory
 * @param {String} [options.cwd] The current working directory
 * @param {String} [options.dataExtension] The file extension for data files
 * @param {String} [options.partialExtension] The file extension for partial files
 * @return {Function} The registration function
 *
 * @example
 * var helpers = require("mosaic-handlebars-helpers");
 * module.exports.register = helpers.partial({ base: "source/partials" });
 */
module.exports.register = function(options) {
  options = _.extend({
    cwd: process.cwd(),
    dataExtension: ".json",
    partialExtension: ".hbs"
  }, options);

  if (!options.base) {
    throw new Error("options.base is required");
  }

  /**
   * Assemble-style Handlebars helper registration function.
   *
   * @param {Object} Handlebars The instance to register the helper on
   */
  return function(Handlebars) {
    var cache = {};

    function error(message) {
      throw new Handlebars.Exception("#partial: " + message);
    }

    function getPartial(name) {
      var file;
      var filepath = path.join(options.cwd, options.base, name);
      var partial;

      // Load and parse file contents for front-matter
      try {
        file = matter.read(filepath + options.partialExtension);
      } catch(err) {
        error(err.message);
      }

      // Load optional associated file data
      try {
        _.extend(file.data, optional(filepath + options.dataExtension))
      } catch(err) {
        // Complain about errors unrelated to file existance
        // TODO remove when the following is available in npm
        // https://github.com/tony-o/node-optional/issues/2
        if (err.code !== "MODULE_NOT_FOUND") {
          error(err.message);
        }
      }

      // Define partial
      partial = {
        content: file.content,
        context: {
          file: {
            data: file.data
          }
        },
        name: name,
        original: file.original,
        path: filepath,
        template: Handlebars.compile(file.content)
      };

      // Cache it
      cache[name] = partial;

      return partial;
    }

    /**
     * Alternative partial implementation that allows partials to have context.
     *
     * @param {String} name The name of the partial
     * @param {Object} [context] Additional context for rendering the partial
     * @return {String} The HTML of the rendered partial
     *
     * @example {{{partial [foo/bar] baz}}}
     */
    Handlebars.registerHelper("partial", function(name, context) {
      if (typeof name !== "string") {
        error("Name must be defined");
      }

      var data;
      var options = arguments[arguments.length - 1];
      var partial = cache[name] || getPartial(name);

      // Define @data keys
      if (options.data) {
        data = Handlebars.createFrame(options.data);
        data.base = context;
        data.name = partial.name;
        data.path = partial.path;
        options.data = data;
      }

      // Mutate context with partial data
      _.extend(context, partial.context);

      // Parse template into HTML
      var html = partial.template(context, options);

      return new Handlebars.SafeString(html);
    });
  };
};
