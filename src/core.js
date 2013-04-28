JPF.genParticles = function(){
	var N = 200;
	var i;

	for(i = 0; i < N; i++){
		var particle = {};

		particle.m = 1.8*Math.random() + 0.2;
		particle.r = 0.01 * Math.sqrt(particle.m);

		particle.color = [Math.random()*255|0,Math.random()*255|0,Math.random()*255|0,1];
		particle.x = 2*(Math.random()) * JPF.getRenderBoxWidth() / JPF.getRenderBoxHeight();
		particle.y = 2*(Math.random());
		particle.vx = 0.25*(Math.random()*2-1);
		particle.vy = 0.25*(Math.random()*2-1);

		var collision = false;
		// if(particle.x - particle.r < 0 || particle.y - particle.r < 0 || particle.x + particle.r > 1 || particle.y + particle.r > 1){collision = true;}

		for(var j = 0; j < i && !collision; j++){
			var particleB = JPF.particles[j];

			var dist = Math.sqrt(Math.pow(particle.x - particleB.x,2) + Math.pow(particle.y - particleB.y,2));

			if(dist <= particle.r + particleB.r){
				collision = true;
			}
		}

		if(collision){
			// i--;
			i--;	
		}else{
			JPF.particles.push(particle);
		}
	}
};

JPF.updateParticles = function(deltaTime){
	deltaTime/=1000;

	if(JPF.mouseDown()){
		var springX = JPF.mousePos[0];
		var springY = JPF.mousePos[1];
		JPF.globalSpringForce(deltaTime,1,springX * JPF.getRenderBoxWidth() / JPF.getRenderBoxHeight(),springY);
	}

	// //Center Spring
	// JPF.globalSpringForce(deltaTime,1,0.5,0.5);


	JPF.updateVelocities(deltaTime);
	JPF.checkCollisions(deltaTime);
	JPF.updateParticlePositions(deltaTime);
};

JPF.globalSpringForce = function(deltaTime,k,springX,springY){
	var N = JPF.particles.length;
	var i;
	for(i = 0; i < N; i++){
		var particle = JPF.particles[i];
		var m = particle.m;
		var x = particle.x;
		var y = particle.y;

		var forceX = 0;
		var forceY = 0;

		var dist2 = Math.pow(x-springX,2) + Math.pow(y-springY,2);
		var dist = Math.sqrt(dist2);

		if(dist == 0){continue;} //TODO make this robust
		
		var force = k*dist;

		forceX += force * (springX - x) / dist;
		forceY += force * (springY - y) / dist;

		particle.vx += k * deltaTime * forceX;
		particle.vy += k * deltaTime * forceY;
	}
};

JPF.updateVelocities = function(deltaTime){
	var N = JPF.particles.length;
	var i,j;

	var G = 0.0002;
	var b = 1
	for(i = 0; i < N; i++){
		var particle = JPF.particles[i];
		var m = particle.m;
		var x = particle.x;
		var y = particle.y;

		var forceX = 0;
		var forceY = 0;

		for(j = 0; j < N; j++){
			var particleN = JPF.particles[j];
			var mN = particle.m;
			var dist2 = Math.pow(x-particleN.x,2) + Math.pow(y-particleN.y,2);
			var dist = Math.sqrt(dist2);

			if(dist == 0){continue;} //TODO make this robust
			
			var force = mN / (dist2+0.00001);

			if(dist < particle.r + particleN.r){
				force *= dist / (particle.r + particleN.r);
			}

			forceX += force * (particleN.x - x) / dist;
			forceY += force * (particleN.y - y) / dist;
		}

		particle.vx += G * deltaTime * forceX;
		particle.vy += G * deltaTime * forceY;

		//Drag force here
		var V = Math.sqrt(Math.pow(particle.vx,2)+Math.pow(particle.vy,2));
		if(V == 0){continue;}
		var normX = particle.vx / V;
		var normY = particle.vy / V;

		particle.vx -= b * deltaTime * V * normX;
		particle.vy -= b * deltaTime * V * normY;		
	}
};

JPF.checkCollisions = function(deltaTime){
	var N = JPF.particles.length;
	var i,j;

	var Cr = 0.9;
	for(i = 0; i < N; i++){
		var particleA = JPF.particles[i];

		var vxA = particleA.vx;
		var vyA = particleA.vy;

		var xA  = particleA.x + deltaTime*vxA;
		var yA  = particleA.y + deltaTime*vyA;

		var mA  = particleA.m;
		var rA  = particleA.r;

		//Inefficient TODO: use AABB tree
		for(j = i+1; j < N; j++){
			var particleB = JPF.particles[j];

			var vxB = particleB.vx;
			var vyB = particleB.vy;
			var mB  = particleB.m;
			var rB  = particleB.r;

			var xB = particleB.x + deltaTime*vxB;
			var yB = particleB.y + deltaTime*vyB;

			var dist = Math.sqrt(Math.pow(xB-xA,2) + Math.pow(yB-yA,2));

			if(dist < rA + rB){

				//Collision detected

				// Proper collision reolution
				var xNorm = (xB-xA) / dist;
				var yNorm = (yB-yA) / dist;

				// var xTan =  yNorm;
				// var yTan = -xNorm;

				// var vA = vxA * xNorm + vyA * yNorm;
				// var vB = vxB * xNorm + vyB * yNorm;

				// var vAT = vxA * xTan + vyA * yTan;
				// var vBT = vxB * xTan + vyB * yTan;

				// var vANew = (Cr * mB * (vB - vA) + mB * vB + mA * vA) / (mA + mB);
				// var vBNew = (Cr * mA * (vA - vB) + mB * vB + mA * vA) / (mA + mB);

				// particleA.vx = vANew * xNorm + vAT * xTan;
				// particleA.vy = vANew * yNorm + vAT * yTan;
				// particleB.vx = vBNew * xNorm + vBT * xTan;
				// particleB.vy = vBNew * yNorm + vBT * yTan;

				//Force resolution
				var k = 0.03;
				var force = -(dist - (rA + rB)) / (dist + 0.0001) * mB * mA;
				particleA.vx -= k * force * xNorm / mA;
				particleA.vy -= k * force * yNorm / mA;
				particleB.vx += k * force * xNorm / mB;
				particleB.vy += k * force * yNorm / mB;
			}
		}
	}

	//Check boundries for now
	for(i = 0; i < N; i++){
		var particleA = JPF.particles[i];

		var vxA = particleA.vx;
		var vyA = particleA.vy;

		var xA  = particleA.x + deltaTime*vxA;
		var yA  = particleA.y + deltaTime*vyA;

		// if(xA < rA || xA > 1-rA){
		// 	particleA.vx *= -1;
		// }

		// if(yA < rA || yA > 1-rA){
		// 	particleA.vy *= -1;
		// }
	}
}

JPF.updateParticlePositions = function(deltaTime){
	var N = JPF.particles.length;
	var i;

	for(i = 0; i < N; i++){
		var particle = JPF.particles[i];
		particle.x += deltaTime*particle.vx;
		particle.y += deltaTime*particle.vy;

		// particle.x = particle.x < 0 ? 0 : particle.x > 1 ? 1 : particle.x;
		// particle.y = particle.y < 0 ? 0 : particle.y > 1 ? 1 : particle.y;
	}
};
