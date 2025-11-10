(function() {
  'use strict';
  var Dbric, GUY, PATH, SFMODULES, SQL, Shell, alert, debug, echo, execaSync, freeze, help, info, inspect, internals, log, plain, praise, reverse, rpr, type_of, urge, warn, whisper;

  //===========================================================================================================
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('demo-execa'));

  ({rpr, inspect, echo, reverse, log} = GUY.trm);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('../../../apps/bricabrac-sfmodules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({Dbric, SQL, internals} = SFMODULES.unstable.require_dbric());

  //-----------------------------------------------------------------------------------------------------------
  PATH = require('node:path');

  ({execaSync} = require('execa'));

  ({freeze} = Object);

  ({
    //===========================================================================================================
    shell_cfg_template: {
      lines: false,
      //.........................................................................................................
      only_stdout: false,
      decode_octal: false
    }
  });

  //===========================================================================================================
  Shell = class Shell {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      this.cfg = freeze({...shell_cfg_template, ...cfg});
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_call_arguments(cfg, cmd, ...parameters) {
      var type;
      // whisper 'Ωbvfs__32', { cfg, cmd, parameters, }
      switch (type = type_of(cfg)) {
        case 'text':
          if (cmd === void 0) {
            [cfg, cmd, ...parameters] = [{}, cfg, ...parameters];
          } else {
            [cfg, cmd, ...parameters] = [{}, cfg, cmd, ...parameters];
          }
          break;
        case 'pod':
          null;
          break;
        default:
          throw new Error(`Ωbvfs__33 expected a pod or a text, got a ${type}`);
      }
      //.......................................................................................................
      if ((type = type_of(cmd)) !== 'text') {
        throw new Error(`Ωbvfs__34 expected a text, got a ${type}`);
      }
      //.......................................................................................................
      cfg = {...this.cfg, ...cfg};
      // info 'Ωbvfs__35', { cfg, cmd, parameters, }
      return {cfg, cmd, parameters};
    }

    //---------------------------------------------------------------------------------------------------------
    call(cfg, cmd, ...parameters) {
      var R;
      ({cfg, cmd, parameters} = this._validate_call_arguments(cfg, cmd, ...parameters));
      // debug 'Ωbvfs__36', cfg
      R = execaSync(cmd, parameters, cfg);
      if (cfg.only_stdout) {
        // debug 'Ωbvfs__37', R
        // if cfg.decode_octal
        //   if cfg.lines then R.stdout = ( decode_octal line for line in R.stdout )
        //   else              R.stdout = decode_octal R.stdout
        return R.stdout;
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode_octal(text) {
      return text.replace(/(?<!\\)\\([0-7]{3})/gv, function($0, $1) {
        return String.fromCodePoint(parseInt($1, 8));
      });
    }

  };

  //===========================================================================================================
  module.exports = {Shell};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQTs7O0VBR0EsR0FBQSxHQUE0QixPQUFBLENBQVEsS0FBUjs7RUFDNUIsQ0FBQSxDQUFFLEtBQUYsRUFDRSxLQURGLEVBRUUsSUFGRixFQUdFLElBSEYsRUFJRSxLQUpGLEVBS0UsTUFMRixFQU1FLElBTkYsRUFPRSxJQVBGLEVBUUUsT0FSRixDQUFBLEdBUTRCLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBUixDQUFvQixZQUFwQixDQVI1Qjs7RUFTQSxDQUFBLENBQUUsR0FBRixFQUNFLE9BREYsRUFFRSxJQUZGLEVBR0UsT0FIRixFQUlFLEdBSkYsQ0FBQSxHQUk0QixHQUFHLENBQUMsR0FKaEMsRUFiQTs7O0VBbUJBLFNBQUEsR0FBZ0MsT0FBQSxDQUFRLG1DQUFSOztFQUNoQyxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWdDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFoQzs7RUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLEdBREYsRUFFRSxTQUZGLENBQUEsR0FFZ0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFuQixDQUFBLENBRmhDLEVBckJBOzs7RUF5QkEsSUFBQSxHQUFnQyxPQUFBLENBQVEsV0FBUjs7RUFDaEMsQ0FBQSxDQUFFLFNBQUYsQ0FBQSxHQUFnQyxPQUFBLENBQVEsT0FBUixDQUFoQzs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQWdDLE1BQWhDOztFQUlBLENBQUEsQ0FBQTs7SUFBQSxrQkFBQSxFQUNFO01BQUEsS0FBQSxFQUFvQixLQUFwQjs7TUFFQSxXQUFBLEVBQW9CLEtBRnBCO01BR0EsWUFBQSxFQUFvQjtJQUhwQjtFQURGLENBQUEsRUEvQkE7OztFQXVDTSxRQUFOLE1BQUEsTUFBQSxDQUFBOztJQUdFLFdBQWEsQ0FBRSxHQUFGLENBQUE7TUFDWCxJQUFDLENBQUEsR0FBRCxHQUFPLE1BQUEsQ0FBTyxDQUFFLEdBQUEsa0JBQUYsRUFBeUIsR0FBQSxHQUF6QixDQUFQO0FBQ1AsYUFBTztJQUZJLENBRGY7OztJQU1FLHdCQUEwQixDQUFFLEdBQUYsRUFBTyxHQUFQLEVBQUEsR0FBWSxVQUFaLENBQUE7QUFDNUIsVUFBQSxJQUFBOztBQUNJLGNBQU8sSUFBQSxHQUFPLE9BQUEsQ0FBUSxHQUFSLENBQWQ7QUFBQSxhQUNPLE1BRFA7VUFFSSxJQUFHLEdBQUEsS0FBTyxNQUFWO1lBQTBCLENBQUUsR0FBRixFQUFPLEdBQVAsRUFBWSxHQUFBLFVBQVosQ0FBQSxHQUErQixDQUFFLENBQUEsQ0FBRixFQUFNLEdBQU4sRUFBaUIsR0FBQSxVQUFqQixFQUF6RDtXQUFBLE1BQUE7WUFDMEIsQ0FBRSxHQUFGLEVBQU8sR0FBUCxFQUFZLEdBQUEsVUFBWixDQUFBLEdBQStCLENBQUUsQ0FBQSxDQUFGLEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBaUIsR0FBQSxVQUFqQixFQUR6RDs7QUFERztBQURQLGFBSU8sS0FKUDtVQUltQjtBQUFaO0FBSlA7VUFLTyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMENBQUEsQ0FBQSxDQUE2QyxJQUE3QyxDQUFBLENBQVY7QUFMYixPQURKOztNQVFJLElBQU8sQ0FBRSxJQUFBLEdBQU8sT0FBQSxDQUFRLEdBQVIsQ0FBVCxDQUFBLEtBQTBCLE1BQWpDO1FBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGlDQUFBLENBQUEsQ0FBb0MsSUFBcEMsQ0FBQSxDQUFWLEVBRFI7T0FSSjs7TUFXSSxHQUFBLEdBQU0sQ0FBRSxHQUFBLElBQUMsQ0FBQSxHQUFILEVBQVcsR0FBQSxHQUFYLEVBWFY7O0FBYUksYUFBTyxDQUFFLEdBQUYsRUFBTyxHQUFQLEVBQVksVUFBWjtJQWRpQixDQU41Qjs7O0lBdUJFLElBQU0sQ0FBRSxHQUFGLEVBQU8sR0FBUCxFQUFBLEdBQVksVUFBWixDQUFBO0FBQ1IsVUFBQTtNQUFJLENBQUEsQ0FBRSxHQUFGLEVBQU8sR0FBUCxFQUFZLFVBQVosQ0FBQSxHQUE0QixJQUFDLENBQUEsd0JBQUQsQ0FBMEIsR0FBMUIsRUFBK0IsR0FBL0IsRUFBb0MsR0FBQSxVQUFwQyxDQUE1QixFQUFKOztNQUVJLENBQUEsR0FBWSxTQUFBLENBQVUsR0FBVixFQUFlLFVBQWYsRUFBMkIsR0FBM0I7TUFLWixJQUFtQixHQUFHLENBQUMsV0FBdkI7Ozs7O0FBQUEsZUFBTyxDQUFDLENBQUMsT0FBVDs7QUFDQSxhQUFPO0lBVEgsQ0F2QlI7OztJQW1DRSxZQUFjLENBQUUsSUFBRixDQUFBO2FBQVksSUFBSSxDQUFDLE9BQUwsQ0FBYSx1QkFBYixFQUFzQyxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sQ0FBQTtBQUM5RCxlQUFPLE1BQU0sQ0FBQyxhQUFQLENBQXFCLFFBQUEsQ0FBUyxFQUFULEVBQWEsQ0FBYixDQUFyQjtNQUR1RCxDQUF0QztJQUFaOztFQXJDaEIsRUF2Q0E7OztFQWdGQSxNQUFNLENBQUMsT0FBUCxHQUFpQixDQUNmLEtBRGU7QUFoRmpCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuR1VZICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2d1eSdcbnsgYWxlcnRcbiAgZGVidWdcbiAgaGVscFxuICBpbmZvXG4gIHBsYWluXG4gIHByYWlzZVxuICB1cmdlXG4gIHdhcm5cbiAgd2hpc3BlciB9ICAgICAgICAgICAgICAgPSBHVVkudHJtLmdldF9sb2dnZXJzICdkZW1vLWV4ZWNhJ1xueyBycHJcbiAgaW5zcGVjdFxuICBlY2hvXG4gIHJldmVyc2VcbiAgbG9nICAgICB9ICAgICAgICAgICAgICAgPSBHVVkudHJtXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vLi4vYXBwcy9icmljYWJyYWMtc2Ztb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgRGJyaWMsXG4gIFNRTCxcbiAgaW50ZXJuYWxzLCAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZGJyaWMoKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5QQVRIICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbnsgZXhlY2FTeW5jLCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZXhlY2EnXG57IGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuc2hlbGxfY2ZnX3RlbXBsYXRlOlxuICBsaW5lczogICAgICAgICAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgb25seV9zdGRvdXQ6ICAgICAgICBmYWxzZVxuICBkZWNvZGVfb2N0YWw6ICAgICAgIGZhbHNlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTaGVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBAY2ZnID0gZnJlZXplIHsgc2hlbGxfY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdmFsaWRhdGVfY2FsbF9hcmd1bWVudHM6ICggY2ZnLCBjbWQsIHBhcmFtZXRlcnMuLi4gKSAtPlxuICAgICMgd2hpc3BlciAnzqlidmZzX18zMicsIHsgY2ZnLCBjbWQsIHBhcmFtZXRlcnMsIH1cbiAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgY2ZnXG4gICAgICB3aGVuICd0ZXh0J1xuICAgICAgICBpZiBjbWQgaXMgdW5kZWZpbmVkIHRoZW4gIFsgY2ZnLCBjbWQsIHBhcmFtZXRlcnMuLi4sIF0gPSBbIHt9LCBjZmcsICAgICAgIHBhcmFtZXRlcnMuLi4sIF1cbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICBbIGNmZywgY21kLCBwYXJhbWV0ZXJzLi4uLCBdID0gWyB7fSwgY2ZnLCBjbWQsICBwYXJhbWV0ZXJzLi4uLCBdXG4gICAgICB3aGVuICdwb2QnICB0aGVuIG51bGxcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlidmZzX18zMyBleHBlY3RlZCBhIHBvZCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgY21kICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJ2ZnNfXzM0IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjZmcgPSB7IEBjZmcuLi4sIGNmZy4uLiwgfVxuICAgICMgaW5mbyAnzqlidmZzX18zNScsIHsgY2ZnLCBjbWQsIHBhcmFtZXRlcnMsIH1cbiAgICByZXR1cm4geyBjZmcsIGNtZCwgcGFyYW1ldGVycywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2FsbDogKCBjZmcsIGNtZCwgcGFyYW1ldGVycy4uLiApIC0+XG4gICAgeyBjZmcsIGNtZCwgcGFyYW1ldGVycywgfSA9IEBfdmFsaWRhdGVfY2FsbF9hcmd1bWVudHMgY2ZnLCBjbWQsIHBhcmFtZXRlcnMuLi5cbiAgICAjIGRlYnVnICfOqWJ2ZnNfXzM2JywgY2ZnXG4gICAgUiAgICAgICAgID0gZXhlY2FTeW5jIGNtZCwgcGFyYW1ldGVycywgY2ZnXG4gICAgIyBkZWJ1ZyAnzqlidmZzX18zNycsIFJcbiAgICAjIGlmIGNmZy5kZWNvZGVfb2N0YWxcbiAgICAjICAgaWYgY2ZnLmxpbmVzIHRoZW4gUi5zdGRvdXQgPSAoIGRlY29kZV9vY3RhbCBsaW5lIGZvciBsaW5lIGluIFIuc3Rkb3V0IClcbiAgICAjICAgZWxzZSAgICAgICAgICAgICAgUi5zdGRvdXQgPSBkZWNvZGVfb2N0YWwgUi5zdGRvdXRcbiAgICByZXR1cm4gUi5zdGRvdXQgaWYgY2ZnLm9ubHlfc3Rkb3V0XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9vY3RhbDogKCB0ZXh0ICkgLT4gdGV4dC5yZXBsYWNlIC8oPzwhXFxcXClcXFxcKFswLTddezN9KS9ndiwgKCAkMCwgJDEgKSAtPlxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludCBwYXJzZUludCAkMSwgOFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBTaGVsbCwgfVxuIl19
