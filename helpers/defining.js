/**
 * Assemble-style Handlebars helper registration function.
 *
 * @param {Object} Handlebars The instance to register the helper on
 */
module.exports.register = function(Handlebars) {
  /**
   * Allows the usage of custom `@data` properties inside of a block.
   *
   * @param {Object} options.hash A hash of properties to set.
   * @return {String} The resulting HTML of the rendered block.
   *
   * @example {{#defining foo="bar"}}@foo{{/defining}}
   */
  Handlebars.registerHelper("defining", function(options) {
    var data;

    if (options.data && options.hash) {
      data = Handlebars.createFrame(options.data);
      Object.keys(options.hash).forEach(function(key) {
        data[key] = options.hash[key];
      });
      options.data = data;
    }

    return options.fn(this, options);
  });
};
