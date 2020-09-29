class TimeSync {
  constructor() {
    this._name = 'TimeSync';

    // Not in use now, may not be needed
    this.clientTime = 0;
    this.supportTime = 0;

    // Our time, used for determining difference in clocks
    this.ourTime = 0;
    // Time diff between connected users (includes latency and diff in clocks)
    this.timeDiff = 0;
    // Time of last click (for support user)
    this.clickTime = new Date().getTime();
    // Send time every 10 seconds
    this.longTimeTimer = null;
    // Send time every second until connection is established
    this.shortTimeTimer = null;
    // Time of receipt of click
    this.clickRecTime = parseInt(this.clickTime, 10) + parseInt(1, 10);
    // Keeps track of clicks and receipts of clicks (incremented and decremented)
    this.clickCounter = 0;

    // variables referenced from main index script
    this.socket = null;
    this.supportUser = null;
  }
  get name() {
    return this._name;
  }

  setClickRevTime(theirClickRecTime) {
    // Set the click receive time and decrement the click counter
    this.clickRecTime = theirClickRecTime.time;
    this.clickCounter--;
  }

  // Start function to start transferring our time
  startTimeSync(supportUser, socket) {
    let obj = this;

    // Set Globals
    if (obj.supportUser === null) {
      obj.supportUser = supportUser;
    }
    if (obj.socket === null) {
      obj.socket = socket;
    }

    if (obj.supportUser) {
      // Support users connect immediatelly, send time after short delay
      setTimeout(function () {
        obj.socket.compress(true).emit('time', new Date().getTime());
      }, 1000);

      // Set up 10 second interval to send our time
      this.longTimeTimer = setInterval(function () {
        obj.socket.compress(true).emit('time', new Date().getTime());
      }, 10000);
    } else {
      // Send time every second until support user connects
      this.shortTimeTimer = setInterval(function () {
        obj.socket.compress(true).emit('time', new Date().getTime());
      }, 1000);
    }
  }

  processReceivedTime(timeData) {
    let obj = this;

    // If client on first receive of support user time, clear out short send interval
    if (!obj.supportUser) {
      clearTimeout(this.shortTimeTimer);

      // Set up long poll interval
      if (this.longTimeTimer === null) {
        this.longTimeTimer = setInterval(function () {
          obj.socket.compress(true).emit('time', new Date().getTime());
        }, 10000);
      }
    }

    // Call function to calculate difference in clocks
    this.calculateTimeDiff(timeData);
  }

  calculateTimeDiff(theirTime) {
    let ourTime = new Date().getTime();

    this.timeDiff = ourTime - theirTime;
  }

  clickOccurred() {
    // Record our time and increment the click counter
    this.clickTime = new Date().getTime();
    this.clickCounter++;
  }

  getClickRecTime() {
    // Return the last click receipt time
    return this.clickRecTime;
  }
}

export let timeSync = new TimeSync();
