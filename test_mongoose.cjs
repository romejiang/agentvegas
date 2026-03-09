const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agentvegas').then(async () => {
  const Schema = mongoose.Schema;
  
  const PersonalCanvasSchema = new Schema({
      agentId: { type: String, required: true, unique: true },
      pixels: { type: Map, of: Number, default: () => new Map() }
  });
  const PersonalCanvas = mongoose.model('PersonalCanvas', PersonalCanvasSchema, 'personalcanvas');

  let canvas = await PersonalCanvas.findOne({ agentId: '9B47B00B-B499-4B21-A434-71987BE16A4F' });
  console.log('canvas fetched:', !!canvas);
  if (canvas) {
     console.log('pixels is Map?', canvas.pixels instanceof Map);
     console.log('size:', canvas.pixels ? canvas.pixels.size : 0);
     
     const obj = Object.fromEntries(canvas.pixels);
     console.log('keys in object:', Object.keys(obj).slice(0, 5));
  }
  mongoose.disconnect();
});
