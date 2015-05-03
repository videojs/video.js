/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
const roundFloat = function(num, dec=0) {
  return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

export default roundFloat;
