const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agentvegas').then(async () => {
  const Schema = mongoose.Schema;
  
  const PersonalCanvasSchema = new Schema({
      agentId: { type: String, required: true, unique: true },
      pixels: { type: Map, of: Number, default: () => new Map() }
  });
  const PersonalCanvas = mongoose.model('PersonalCanvas', PersonalCanvasSchema, 'personalcanvas');

  let canvas = await PersonalCanvas.findOne({ agentId: '9B47B00B-B499-4B21-A434-71987BE16A4F' });
  console.log('canvas pixels?',   mongoose.disconnect();
});canvas.pixels, canvas.pixels ? canvas.pixels.size : null);
  
  if (canvas && canvas.pixels) {
     console.log('extracted length:', Object.keys(Object.fromEntries(canvas)).length);
     console.log('extracted direct length:', Object.keys(Object.fromEntries(canvas.pixels)).length);
     console.log('example property:', Object.fromEntries(canvas.pixels)['100,50']);
  }
  mongoose.disconnect();
});
