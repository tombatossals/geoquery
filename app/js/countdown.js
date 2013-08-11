function CountDown(canvas, seconds) {
    this.canvas = canvas;
    this.seconds = seconds;
    this.processed_time = getUnixTimestamp();
    this.eta_time = getUnixTimestamp()+50;
    this.destroy = false;
    this.countdown();
}

function getUnixTimestamp() {
    return Math.floor((new Date()).getTime() / 100);
}

CountDown.prototype.countdown = function() {
    var timeLeft = this.eta_time - getUnixTimestamp();
    if (timeLeft >= 0 && !this.destroy) {
        drawTimer(this.canvas, this.processed_time, this.eta_time, timeLeft);
        var self = this;
        setTimeout(function() { return self.countdown(); }, 100);
    } else {
        this.canvas.width = this.canvas.width;
    }
}

CountDown.prototype.stop = function() {
    this.destroy = true;
}

function drawTimer(canvas, processed, eta, timeLeft) {
    var timePassed = getUnixTimestamp() - processed;
    var countTo = eta - processed;
    var counter = timePassed;
    var sec = Math.floor(timeLeft/10);
    var dec = timeLeft%10;

    // failsafe
    if (timeLeft <= 0) {
        sec = 0;
        dec = 0;
    }

    var inc=360/countTo;
    var angle=270 + (inc * counter);

    var ctx=canvas.getContext('2d');
    var cWidth=canvas.width;
    var cHeight=canvas.height;

    canvas.width = canvas.width;
    //======= reset canvas

    ctx.fillStyle="#FFF";
    ctx.fillRect(0,0,cWidth,cHeight);

    //========== dynamic arc

    ctx.beginPath();
    ctx.strokeStyle="#696d32";
    ctx.lineWidth=12;
    ctx.arc(cWidth/2,cHeight/2,40,(Math.PI/180)*270,(Math.PI/180)*angle,false);
    ctx.stroke();
    ctx.closePath();

    //======== inner shadow arc

    ctx.beginPath();
    ctx.strokeStyle="#cad61e";
    ctx.lineWidth=5;
    ctx.arc(cWidth/2,cHeight/2,40,(Math.PI/180)*0,(Math.PI/180)*360,false);
    ctx.stroke();
    ctx.closePath();

    //====== Labels
    var fontFace="helvetica, arial, sans-serif";
    ctx.fillStyle='#222';

    if (sec>9) {
        ctx.font='30px '+fontFace;
        ctx.fillText(sec,cWidth/2-34,cHeight/2+15);
    } else {
        ctx.font='38px '+fontFace;
        ctx.fillText(sec,cWidth/2-22,cHeight/2+15);
    }

    ctx.font='15px '+fontFace;
    ctx.fillText('.',cWidth/2+0,cHeight/2+13);
    ctx.font='22px '+fontFace;
    ctx.fillText(dec,cWidth/2+5,cHeight/2+15);
}
