(function() {
  'use strict';
  var Dbric, GUY, PATH, SFMODULES, SQL, Shell, alert, debug, echo, execaSync, freeze, help, info, inspect, internals, log, plain, praise, reverse, rpr, shell_cfg_template, type_of, urge, warn, whisper;

  //===========================================================================================================
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('demo-execa'));

  ({rpr, inspect, echo, reverse, log} = GUY.trm);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('bricabrac-sfmodules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({Dbric, SQL, internals} = SFMODULES.unstable.require_dbric());

  //-----------------------------------------------------------------------------------------------------------
  PATH = require('node:path');

  ({execaSync} = require('execa'));

  ({freeze} = Object);

  //===========================================================================================================
  shell_cfg_template = {
    lines: false, // whether to return lists of lines for stdout, stderr
    reject: true, // `true`: throw errors, `false`: return errors
    //.........................................................................................................
    /* extensions: */
    only_stdout: false, // whether to only return `stdout`
    decode_octal: false
  };

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
      // whisper 'Ωbvfs___1', { cfg, cmd, parameters, }
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
          throw new Error(`Ωbvfs___2 expected a pod or a text, got a ${type}`);
      }
      //.......................................................................................................
      if ((type = type_of(cmd)) !== 'text') {
        throw new Error(`Ωbvfs___3 expected a text, got a ${type}`);
      }
      //.......................................................................................................
      cfg = {...this.cfg, ...cfg};
      // info 'Ωbvfs___4', { cfg, cmd, parameters, }
      return {cfg, cmd, parameters};
    }

    //---------------------------------------------------------------------------------------------------------
    call(cfg, cmd, ...parameters) {
      var R, error;
      ({cfg, cmd, parameters} = this._validate_call_arguments(cfg, cmd, ...parameters));
      try {
        // debug 'Ωbvfs___5', cfg
        // cfg.reject = false
        R = execaSync(cmd, parameters, cfg);
      } catch (error1) {
        error = error1;
        debug('Ωbvfs___6', rpr(R != null ? R.stderr : void 0));
        debug('Ωbvfs___7', 'stderr          ', rpr(error.stderr));
        debug('Ωbvfs___8', 'name            ', rpr(error.name));
        debug('Ωbvfs___9', 'code            ', rpr(error.code));
        debug('Ωbvfs__10', 'exitCode        ', rpr(error.exitCode));
        debug('Ωbvfs__11', 'message         ', rpr(error.message));
        debug('Ωbvfs__12', 'shortMessage    ', rpr(error.shortMessage));
        debug('Ωbvfs__13', 'originalMessage ', rpr(error.originalMessage));
        debug('Ωbvfs__14', 'cause           ', rpr(error.cause));
        throw error;
      }
      if (cfg.only_stdout) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUEsa0JBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBOzs7RUFHQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSxLQUFSOztFQUM1QixDQUFBLENBQUUsS0FBRixFQUNFLEtBREYsRUFFRSxJQUZGLEVBR0UsSUFIRixFQUlFLEtBSkYsRUFLRSxNQUxGLEVBTUUsSUFORixFQU9FLElBUEYsRUFRRSxPQVJGLENBQUEsR0FRNEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFSLENBQW9CLFlBQXBCLENBUjVCOztFQVNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsT0FERixFQUVFLElBRkYsRUFHRSxPQUhGLEVBSUUsR0FKRixDQUFBLEdBSTRCLEdBQUcsQ0FBQyxHQUpoQyxFQWJBOzs7RUFtQkEsU0FBQSxHQUFnQyxPQUFBLENBQVEscUJBQVI7O0VBQ2hDLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBZ0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQWhDOztFQUNBLENBQUEsQ0FBRSxLQUFGLEVBQ0UsR0FERixFQUVFLFNBRkYsQ0FBQSxHQUVnQyxTQUFTLENBQUMsUUFBUSxDQUFDLGFBQW5CLENBQUEsQ0FGaEMsRUFyQkE7OztFQXlCQSxJQUFBLEdBQWdDLE9BQUEsQ0FBUSxXQUFSOztFQUNoQyxDQUFBLENBQUUsU0FBRixD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WUFBVixDQUF2QztRQUNBLEtBQUEsQ0FBTSxXQUFOLEVBQW1CLGtCQUFuQixFQUF1QyxHQUFBLENBQUksS0FBSyxDQUFDLGVBQVYsQ0FBdkM7UUFDQSxLQUFBLENBQU0sV0FBTixFQUFtQixrQkFBbkIsRUFBdUMsR0FBQSxDQUFJLEtBQUssQ0FBQyxLQUFWLENBQXZDO1FBQ0EsTUFBTSxNQVZSOztNQWNBLElBQW1CLEdBQUcsQ0FBQyxXQUF2Qjs7OztBQUFBLGVBQU8sQ0FBQyxDQUFDLE9BQVQ7O0FBQ0EsYUFBTztJQXJCSCxDQXZCUjs7O0lBK0NFLFlBQWMsQ0FBRSxJQUFGLENBQUE7YUFBWSxJQUFJLENBQUMsT0FBTCxDQUFhLHVCQUFiLEVBQXNDLFFBQUEsQ0FBRSxFQUFGLEVBQU0sRUFBTixDQUFBO0FBQzlELGVBQU8sTUFBTSxDQUFDLGFBQVAsQ0FBcUIsUUFBQSxDQUFTLEVBQVQsRUFBYSxDQUFiLENBQXJCO01BRHVELENBQXRDO0lBQVo7O0VBakRoQixFQXpDQTs7O0VBOEZBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLENBQ2YsS0FEZTtBQTlGakIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5HVVkgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZ3V5J1xueyBhbGVydFxuICBkZWJ1Z1xuICBoZWxwXG4gIGluZm9cbiAgcGxhaW5cbiAgcHJhaXNlXG4gIHVyZ2VcbiAgd2FyblxuICB3aGlzcGVyIH0gICAgICAgICAgICAgICA9IEdVWS50cm0uZ2V0X2xvZ2dlcnMgJ2RlbW8tZXhlY2EnXG57IHJwclxuICBpbnNwZWN0XG4gIGVjaG9cbiAgcmV2ZXJzZVxuICBsb2cgICAgIH0gICAgICAgICAgICAgICA9IEdVWS50cm1cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2Ztb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgRGJyaWMsXG4gIFNRTCxcbiAgaW50ZXJuYWxzLCAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZGJyaWMoKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5QQVRIICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbnsgZXhlY2FTeW5jLCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZXhlY2EnXG57IGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuc2hlbGxfY2ZnX3RlbXBsYXRlID1cbiAgbGluZXM6ICAgICAgICAgICAgICBmYWxzZSAjIHdoZXRoZXIgdG8gcmV0dXJuIGxpc3RzIG9mIGxpbmVzIGZvciBzdGRvdXQsIHN0ZGVyclxuICByZWplY3Q6ICAgICAgICAgICAgIHRydWUgICMgYHRydWVgOiB0aHJvdyBlcnJvcnMsIGBmYWxzZWA6IHJldHVybiBlcnJvcnNcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAjIyMgZXh0ZW5zaW9uczogIyMjXG4gIG9ubHlfc3Rkb3V0OiAgICAgICAgZmFsc2UgIyB3aGV0aGVyIHRvIG9ubHkgcmV0dXJuIGBzdGRvdXRgXG4gIGRlY29kZV9vY3RhbDogICAgICAgZmFsc2VcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFNoZWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIEBjZmcgPSBmcmVlemUgeyBzaGVsbF9jZmdfdGVtcGxhdGUuLi4sIGNmZy4uLiwgfVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF92YWxpZGF0ZV9jYWxsX2FyZ3VtZW50czogKCBjZmcsIGNtZCwgcGFyYW1ldGVycy4uLiApIC0+XG4gICAgIyB3aGlzcGVyICfOqWJ2ZnNfX18xJywgeyBjZmcsIGNtZCwgcGFyYW1ldGVycywgfVxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBjZmdcbiAgICAgIHdoZW4gJ3RleHQnXG4gICAgICAgIGlmIGNtZCBpcyB1bmRlZmluZWQgdGhlbiAgWyBjZmcsIGNtZCwgcGFyYW1ldGVycy4uLiwgXSA9IFsge30sIGNmZywgICAgICAgcGFyYW1ldGVycy4uLiwgXVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgIFsgY2ZnLCBjbWQsIHBhcmFtZXRlcnMuLi4sIF0gPSBbIHt9LCBjZmcsIGNtZCwgIHBhcmFtZXRlcnMuLi4sIF1cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4gbnVsbFxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJ2ZnNfX18yIGV4cGVjdGVkIGEgcG9kIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBjbWQgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYnZmc19fXzMgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNmZyA9IHsgQGNmZy4uLiwgY2ZnLi4uLCB9XG4gICAgIyBpbmZvICfOqWJ2ZnNfX180JywgeyBjZmcsIGNtZCwgcGFyYW1ldGVycywgfVxuICAgIHJldHVybiB7IGNmZywgY21kLCBwYXJhbWV0ZXJzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjYWxsOiAoIGNmZywgY21kLCBwYXJhbWV0ZXJzLi4uICkgLT5cbiAgICB7IGNmZywgY21kLCBwYXJhbWV0ZXJzLCB9ID0gQF92YWxpZGF0ZV9jYWxsX2FyZ3VtZW50cyBjZmcsIGNtZCwgcGFyYW1ldGVycy4uLlxuICAgICMgZGVidWcgJ86pYnZmc19fXzUnLCBjZmdcbiAgICAjIGNmZy5yZWplY3QgPSBmYWxzZVxuICAgIHRyeVxuICAgICAgUiAgICAgICAgID0gZXhlY2FTeW5jIGNtZCwgcGFyYW1ldGVycywgY2ZnXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGRlYnVnICfOqWJ2ZnNfX182JywgcnByIFI/LnN0ZGVyclxuICAgICAgZGVidWcgJ86pYnZmc19fXzcnLCAnc3RkZXJyICAgICAgICAgICcsIHJwciBlcnJvci5zdGRlcnJcbiAgICAgIGRlYnVnICfOqWJ2ZnNfX184JywgJ25hbWUgICAgICAgICAgICAnLCBycHIgZXJyb3IubmFtZVxuICAgICAgZGVidWcgJ86pYnZmc19fXzknLCAnY29kZSAgICAgICAgICAgICcsIHJwciBlcnJvci5jb2RlXG4gICAgICBkZWJ1ZyAnzqlidmZzX18xMCcsICdleGl0Q29kZSAgICAgICAgJywgcnByIGVycm9yLmV4aXRDb2RlXG4gICAgICBkZWJ1ZyAnzqlidmZzX18xMScsICdtZXNzYWdlICAgICAgICAgJywgcnByIGVycm9yLm1lc3NhZ2VcbiAgICAgIGRlYnVnICfOqWJ2ZnNfXzEyJywgJ3Nob3J0TWVzc2FnZSAgICAnLCBycHIgZXJyb3Iuc2hvcnRNZXNzYWdlXG4gICAgICBkZWJ1ZyAnzqlidmZzX18xMycsICdvcmlnaW5hbE1lc3NhZ2UgJywgcnByIGVycm9yLm9yaWdpbmFsTWVzc2FnZVxuICAgICAgZGVidWcgJ86pYnZmc19fMTQnLCAnY2F1c2UgICAgICAgICAgICcsIHJwciBlcnJvci5jYXVzZVxuICAgICAgdGhyb3cgZXJyb3JcbiAgICAjIGlmIGNmZy5kZWNvZGVfb2N0YWxcbiAgICAjICAgaWYgY2ZnLmxpbmVzIHRoZW4gUi5zdGRvdXQgPSAoIGRlY29kZV9vY3RhbCBsaW5lIGZvciBsaW5lIGluIFIuc3Rkb3V0IClcbiAgICAjICAgZWxzZSAgICAgICAgICAgICAgUi5zdGRvdXQgPSBkZWNvZGVfb2N0YWwgUi5zdGRvdXRcbiAgICByZXR1cm4gUi5zdGRvdXQgaWYgY2ZnLm9ubHlfc3Rkb3V0XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9vY3RhbDogKCB0ZXh0ICkgLT4gdGV4dC5yZXBsYWNlIC8oPzwhXFxcXClcXFxcKFswLTddezN9KS9ndiwgKCAkMCwgJDEgKSAtPlxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludCBwYXJzZUludCAkMSwgOFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBTaGVsbCwgfVxuIl19
