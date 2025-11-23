(function() {
  var PATH, mount_path;

  PATH = require('node:path');

  mount_path = PATH.resolve(PATH.join(__dirname, '../mount'));

  
const Fuse = require('fuse-native')

const ops = {
  readdir: function (path, cb) {
    console.log('readdir(%s)', path)
    if (path === '/') return process.nextTick(cb, 0, ['test'], [
      {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 12,
        mode: 33188,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      }
    ])
    return process.nextTick(cb, 0)
  },
  /*
  access: function (path, cb) {
    return process.nextTick(cb, 0)
  },
  */
  getattr: function (path, cb) {
    console.log('getattr(%s)', path)
    if (path === '/') {
      return process.nextTick(cb, 0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100,
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
    }

    if (path === '/test') {
      return process.nextTick(cb, 0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 12,
        mode: 33188,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
    }

    return process.nextTick(cb, Fuse.ENOENT)
  },
  open: function (path, flags, cb) {
    console.log('open(%s, %d)', path, flags)
    return process.nextTick(cb, 0, 42) // 42 is an fd
  },
  read: function (path, fd, buf, len, pos, cb) {
    console.log('read(%s, %d, %d, %d)', path, fd, len, pos)
    var str = 'hello world\n'.slice(pos)
    if (!str) return process.nextTick(cb, 0)
    buf.write(str)
    return process.nextTick(cb, str.length)
  }
}

const fuse = new Fuse( mount_path, ops, { debug: true, displayFolder: true })
fuse.mount(err => {
  if (err) throw err
  console.log('filesystem mounted on ' + fuse.mnt)
})

process.once('SIGINT', function () {
  fuse.unmount(err => {
    if (err) {
      console.log('filesystem at ' + fuse.mnt + ' not unmounted', err)
    } else {
      console.log('filesystem at ' + fuse.mnt + ' unmounted')
    }
  })
})
;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RlbW8tZnVzZS1uYXRpdmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxJQUFBLEVBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixVQUFyQixDQUFiOztFQUViOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIlBBVEggPSByZXF1aXJlICdub2RlOnBhdGgnXG5tb3VudF9wYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBfX2Rpcm5hbWUsICcuLi9tb3VudCdcblxuYGBgXG5jb25zdCBGdXNlID0gcmVxdWlyZSgnZnVzZS1uYXRpdmUnKVxuXG5jb25zdCBvcHMgPSB7XG4gIHJlYWRkaXI6IGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgIGNvbnNvbGUubG9nKCdyZWFkZGlyKCVzKScsIHBhdGgpXG4gICAgaWYgKHBhdGggPT09ICcvJykgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soY2IsIDAsIFsndGVzdCddLCBbXG4gICAgICB7XG4gICAgICAgIG10aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBhdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgY3RpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIG5saW5rOiAxLFxuICAgICAgICBzaXplOiAxMixcbiAgICAgICAgbW9kZTogMzMxODgsXG4gICAgICAgIHVpZDogcHJvY2Vzcy5nZXR1aWQgPyBwcm9jZXNzLmdldHVpZCgpIDogMCxcbiAgICAgICAgZ2lkOiBwcm9jZXNzLmdldGdpZCA/IHByb2Nlc3MuZ2V0Z2lkKCkgOiAwXG4gICAgICB9XG4gICAgXSlcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgMClcbiAgfSxcbiAgLypcbiAgYWNjZXNzOiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgMClcbiAgfSxcbiAgKi9cbiAgZ2V0YXR0cjogZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgY29uc29sZS5sb2coJ2dldGF0dHIoJXMpJywgcGF0aClcbiAgICBpZiAocGF0aCA9PT0gJy8nKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgMCwge1xuICAgICAgICBtdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgYXRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGN0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBubGluazogMSxcbiAgICAgICAgc2l6ZTogMTAwLFxuICAgICAgICBtb2RlOiAxNjg3NyxcbiAgICAgICAgdWlkOiBwcm9jZXNzLmdldHVpZCA/IHByb2Nlc3MuZ2V0dWlkKCkgOiAwLFxuICAgICAgICBnaWQ6IHByb2Nlc3MuZ2V0Z2lkID8gcHJvY2Vzcy5nZXRnaWQoKSA6IDBcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKHBhdGggPT09ICcvdGVzdCcpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGNiLCAwLCB7XG4gICAgICAgIG10aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBhdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgY3RpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIG5saW5rOiAxLFxuICAgICAgICBzaXplOiAxMixcbiAgICAgICAgbW9kZTogMzMxODgsXG4gICAgICAgIHVpZDogcHJvY2Vzcy5nZXR1aWQgPyBwcm9jZXNzLmdldHVpZCgpIDogMCxcbiAgICAgICAgZ2lkOiBwcm9jZXNzLmdldGdpZCA/IHByb2Nlc3MuZ2V0Z2lkKCkgOiAwXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGNiLCBGdXNlLkVOT0VOVClcbiAgfSxcbiAgb3BlbjogZnVuY3Rpb24gKHBhdGgsIGZsYWdzLCBjYikge1xuICAgIGNvbnNvbGUubG9nKCdvcGVuKCVzLCAlZCknLCBwYXRoLCBmbGFncylcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgMCwgNDIpIC8vIDQyIGlzIGFuIGZkXG4gIH0sXG4gIHJlYWQ6IGZ1bmN0aW9uIChwYXRoLCBmZCwgYnVmLCBsZW4sIHBvcywgY2IpIHtcbiAgICBjb25zb2xlLmxvZygncmVhZCglcywgJWQsICVkLCAlZCknLCBwYXRoLCBmZCwgbGVuLCBwb3MpXG4gICAgdmFyIHN0ciA9ICdoZWxsbyB3b3JsZFxcbicuc2xpY2UocG9zKVxuICAgIGlmICghc3RyKSByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgMClcbiAgICBidWYud3JpdGUoc3RyKVxuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGNiLCBzdHIubGVuZ3RoKVxuICB9XG59XG5cbmNvbnN0IGZ1c2UgPSBuZXcgRnVzZSggbW91bnRfcGF0aCwgb3BzLCB7IGRlYnVnOiB0cnVlLCBkaXNwbGF5Rm9sZGVyOiB0cnVlIH0pXG5mdXNlLm1vdW50KGVyciA9PiB7XG4gIGlmIChlcnIpIHRocm93IGVyclxuICBjb25zb2xlLmxvZygnZmlsZXN5c3RlbSBtb3VudGVkIG9uICcgKyBmdXNlLm1udClcbn0pXG5cbnByb2Nlc3Mub25jZSgnU0lHSU5UJywgZnVuY3Rpb24gKCkge1xuICBmdXNlLnVubW91bnQoZXJyID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnZmlsZXN5c3RlbSBhdCAnICsgZnVzZS5tbnQgKyAnIG5vdCB1bm1vdW50ZWQnLCBlcnIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmaWxlc3lzdGVtIGF0ICcgKyBmdXNlLm1udCArICcgdW5tb3VudGVkJylcbiAgICB9XG4gIH0pXG59KVxuYGBgIl19
