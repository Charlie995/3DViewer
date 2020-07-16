window.addEventListener('DOMContentLoaded', function() {
     var canvas = document.getElementById('canvas');
     var engine = new BABYLON.Engine(canvas, true);

     function assignLightmapOnMaterial(material, lightmap) {
          material.lightmapTexture = lightmap;
          material.lightmapTexture.coordinatesIndex = 1;
          material.useLightmapAsShadowmap = true;
      }
      
      var createScene = function () {
          // scene init
          var scene = new BABYLON.Scene(engine);
          scene.clearColor = BABYLON.Color3.Black();
          var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.6, 7.6, new BABYLON.Vector3(0,1.5,0), scene);
          camera.minZ = 0.01;
          camera.allowUpsideDown = false;
          camera.wheelPrecision = 150;
          camera.attachControl(canvas, true);
          //var hdrTexture = new BABYLON.CubeTexture("textures/Studio_Softbox_2Umbrellas_cube_specular.env", scene);
          //hdrTexture.gammaSpace = false;
          //scene.environmentTexture = hdrTexture;
          var shaderBall, shaderBallGLTFRoot;
      
          // cornell box
          BABYLON.SceneLoader.ImportMesh(
              "",
              "https://models.babylonjs.com/CornellBox/",
              "cornellBox.glb",
              scene,
              function () {
                  // renaming the default gltf "__root__"
                  scene.getMeshByName("bloc.000").parent.name = "__cornell-root__";
                  // material tweaking
                  scene.materials.forEach(function(material){
                      material.environmentIntensity = 1.4;
                  });
                  scene.getMaterialByName("light.000").emissiveColor = BABYLON.Color3.White(); 
                  var monkeyMtl = scene.getMaterialByName("suzanne.000");
                  monkeyMtl.metallic = 0.64;
                  monkeyMtl.roughness = 0.63;
      
                  // we have to cycles through objects to assign their lightmaps
                  let lightmappedMeshes = ["bloc.000", "suzanne.000", "cornellBox.000"];
                  lightmappedMeshes.forEach(function(mesh){
                      let currentMesh = scene.getNodeByName(mesh);
                      let currentMeshChildren = currentMesh.getChildren();
                      // lightmap texture creation
                      let currentLightmap = new BABYLON.Texture(
                          "https://models.babylonjs.com/CornellBox/" + currentMesh.name + ".lightmap.jpg",
                          scene,
                          false,
                          false);
                      switch(currentMesh.getClassName()){
                          case "Mesh":
                              assignLightmapOnMaterial(currentMesh.material, currentLightmap);
                              break;
                          case "TransformNode": 
                              currentMeshChildren.forEach(function(mesh){
                                  assignLightmapOnMaterial(mesh.material, currentLightmap);
                              });
                              break;  
                      }
                  });
      
                  // all new meshes now receive shadows (shadowGenerator created below)
                  scene.meshes.forEach(function(mesh){
                      mesh.receiveShadows = true;
                  });
          });
      
          // BJS logo 
          BABYLON.SceneLoader.ImportMesh(
              "",
              "https://models.babylonjs.com/",
              "shaderBall.glb",
              scene,
              function (shaderBallMeshes) {
                  // selecting the mesh we will animate later on scene.registerBeforeRender()
                  shaderBall = scene.getMeshByID("simpleShaderBall");
                  // renaming the default gltf empty object "__root__" and adapting it to the scene
                  shaderBallGLTFRoot = shaderBall.parent;
                  shaderBallGLTFRoot.name = "__shaderBall-root__";
                  shaderBallGLTFRoot.scaling.scaleInPlace(0.5);
                  shaderBallGLTFRoot.position.y = 1.6;
                  shaderBallGLTFRoot.rotationQuaternion = null; //this will help for the rotation anim later
                  // tweaking materials
                  var shaderBallMtl = shaderBall.material;
                  //shaderBallMtl.albedoTexture = new BABYLON.Texture("textures/checkerBJS.png", scene);
                  shaderBallMtl.metallic = 1;
                  shaderBallMtl.roughness = 0.33;
                  // dyn light to generate shadows 
                  var light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 0), scene);
                  light.position = new BABYLON.Vector3(0, 3, 0);
                  // shadows handling
                  var shadowGenerator = new BABYLON.ShadowGenerator(128, light);
                  shadowGenerator.useBlurExponentialShadowMap = true;
                  shaderBallMeshes.forEach(function(mesh){
                      shadowGenerator.addShadowCaster(mesh);
                  });
          });
      
          // why not using glow?
          var glowLayer = new BABYLON.GlowLayer("glow", scene, {
              mainTextureFixedSize: 256,
              blurKernelSize: 32
          });
      
          // simple animation for the logo
          var time = 0; //this will be used as a time variable
          scene.registerBeforeRender(function() {
              time += 0.1;
              if(shaderBallGLTFRoot != undefined){
                  shaderBallGLTFRoot.rotation.x += 0.002;
                  shaderBallGLTFRoot.rotation.y -= 0.003;
                  shaderBallGLTFRoot.rotation.z -= 0.001;       
                  shaderBallGLTFRoot.position.y = (Math.cos(time*0.1)*0.15) + 1.5;
              }
          });
      
          return scene;
      };

     var scene = createScene();

     BABYLON.SceneLoader.Append("assets/", "bot.glb", scene, function (scene) 
            {
                // Create a default arc rotate camera and light.
                //scene.createDefaultCameraOrLight(true, true, true);
                //scene.activeCamera.alpha += Math.PI;
            });

     
     engine.runRenderLoop(function() {
          scene.render();
     });
});
