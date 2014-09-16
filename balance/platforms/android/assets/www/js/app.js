angular.module('balance', ['ionic'])
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    
  });
})
.filter('range', function() {
  return function(input, total) {
    total = parseInt(total);
    for (var i=0; i<total; i++) {
      input.push(i);
    }
    return input;
  };
})
.directive('blDraggable', function ($compile, $ionicGesture) {
	Hammer.defaults.behavior.touchAction = 'pan-y';
    return function (scope, element, attrs) {

		var hammertime = Hammer(element[0], {drag: true, prevent_default:true });

		hammertime.on("dragstart", function (e) {
			scope.dragstart(e, attrs);
		});
	
		hammertime.on("drag", function (e) {
			scope.drag(e, attrs);
		});
	
		hammertime.on("dragend", function (e) {
			scope.dragend(e, attrs);
		});
    };
})
.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
        }
      }
    })
    .state('tab.game', {
      url: '/game',
      views: {
        'tab-game': {
          templateUrl: 'templates/game.html',
        }
      }
    })
    .state('tab.help', {
      url: '/help',
      views: {
        'tab-help': {
          templateUrl: 'templates/tab-help.html',
        }
      }
    });
    
    $urlRouterProvider.otherwise('/tab/dash');
})
.controller('MainCtrl', ['$scope', function($scope) {
	$scope.error_msg = "";
	$scope.error = function (err) {
		$scope.error_msg = err;
	};
	
	$scope.system = {
		cordova: window.cordova
	};
	
	$scope.open = function (urlApp) {
		window.open(urlApp,'_system','location=yes');
		return false;
	};	
	
	function migrate () {
		var v = localStorage["version"];
		update = true;
		if (v) {
			var version = parseInt(v);
			if (version >= 5) {
				update = false;
			}
		}

		if (update) {
			delete localStorage["levels"];
			localStorage["current_level"] = 1;
			for (var i=1; i< 7; i++) {
				delete localStorage["level_" + i];
			}
		}
	}
	
	migrate();
	
	try {
		$scope.levels = JSON.parse(localStorage["levels"]);
	}
	catch (err) {
		$scope.levels = {
			"1": 0, "2": 0, "3": 0,
			"4": 0, "5": 0, "6": 0
		};	
	}
	
	localStorage["version"] = "5";
	localStorage["levels"] = JSON.stringify($scope.levels);
	
	$scope.score = function (level, w) {
		if (($scope.levels[level] ===0) || (w<$scope.levels[level])) {
			$scope.levels[level] = w;
			localStorage["levels"] = JSON.stringify($scope.levels);
		}
	};
	
	$scope.setLevel = function (level) {
		localStorage["current_level"] = level;
	}
	
	localStorage["current_level"] = localStorage["current_level"] || 1;
	
}])
.controller('GameCtrl', ['$scope', '$ionicGesture', '$ionicModal', '$window', '$ionicPopup', '$http',
	function($scope, $ionicGesture, $ionicModal, $window, $ionicPopup, $http) {
	var ball;
	var levels = {
		"1" : {
			"heavier": 1,
			"lighter": 1,
			"equal"  : 10,
			"unknown": 0
		},
		"2" : {
			"heavier": 1,
			"lighter": 2,
			"equal"  : 9,
			"unknown": 0
		},
		"3" : {
			"heavier": 2,
			"lighter": 2,
			"equal"  : 8,
			"unknown": 0
		},
		"4" : {
			"heavier": 3,
			"lighter": 3,
			"equal"  : 6,
			"unknown": 0
		},
		"5" : {
			"heavier": 3,
			"lighter": 4,
			"equal"  : 5,
			"unknown": 0
		},
		"6" : {
			"heavier": 0,
			"lighter": 0,
			"equal"  : 0,
			"unknown": 12
		}
	};

	var tutorials = {
		"1": [
			"This is a Practice Level. Click on the arrow bellow to see the next message...",
			"This is a matematical/logical game and there is no luck involved. You will need to think every move carefully, the game is against you...",
			"In this game you have twelve balls, one of them is diferente it can be heavier or lighter. You need to find the odd ball...",
			"In this level you start with 10 balls that you know for sure they are equal, they are grouped in Equal box (Equal: 10)...",
			"The remaing balls are on the groups Heavier and Lighter, this is the balls that you are not sure of there weight...",
			"In this level we can easly find the odd ball by weighting a equal ball with a potencial diferent ball...",
			"To make a weigth you need to drag a even number of balls to balance plates...",
			"Drag one equal ball to the plate, drag one heavier or lighter ball to the other plate...",
			"Press Make Weigth button that appers bellow, two other buttons will appear, 'Good ..' and 'Cancel...'",
			"if you select 'Cancel ...' the weighting will not have any efect and you can try a diferent weighting.",
			"If you select 'Good ...' you are making the weighting efective and you win the game!! See you on next level ;)",
		],
		"2": [
			"I Hope you understanded the concepts on the first level, I will now explain the inferface...",
			"The twelve balls are grouped in the boxs Equal, Heavier, Ligther and sometimes Unkown...",
			"Every box have the name of the group and the number of balls on that group (Ex: 'Equal: 9', 9 balls are know to be equal)...",
			"Remenber that we are not sure of the weight of the balls in the groups Ligther and Heavier...",
			"In this level you have 3 potencial diferent balls, try to make a weight with two equal balls and two ligther balls...",
			"Press Make Weight, the outcome of the weighting is showed in the group boxs on the field weight...",
			"In this case equals (weight: 10), heavier (weight: 0), ligther (weight: 2)...",
			"Press 'Good ...' and the weighting will take efect...",
			"Since now we only have equal and ligther groups we know for sure that the odd ball is ligther...",
			"Now we can easly find the odd ball, lets see some logical cases...",
			"If we weight one equal ball with one of lighter balls, if ball is equal than the remaing is the odd ball...",
			"If we weight both lighter balls the lighter ball in the balance is the odd ball, the heavier ball belongs on the equal group...",
			"You can try this and then press cancel to try diferent cases...",
			"The goal of the game is not only to find the odd ball, but to find it with less tries as possible...",
			"Every time you make a weight the number increses (showed bellow the balance)...",
			"In this level you can find the odd ball with only one weight, press restart and try it...",
			"Cant do it?? I will give you a help, you have 3 potenticial odd balls,...",
			"Always think on the worst case cenario, and keep in mind there is more than one solution, ...",
			"One of the solution is to weigth the ligther balls, put one ligther balls on each plate, ...",
			"If both balls are equal than the odd ball is the remaing heavier ball,...",
			"If the balls are not equal than the remaining ball on the heaviar group bellongs on the equal group, ...",
			"Since we know that the balls in balance where in the ligther group, than the heaviar ball belongs on the equal group and ...",
			"The ligther ball would be the odd ball...",
			"See if you can find other solution and when ready I will see you on next level..."
		],
		"3": [
			"Last game was fun, hope you have enjoy it...",
			"To remove balls from the balance just click/tap on the ball you want to remove, ...",
			"There is a help button that you can always check during the game, to come back just select game,...",
			"You can always come back to active game by selecting the game button, ...",
			"Well thats it, there isn't much more to say, but I will give you some tips...",
			"Think of each ball group as a box with balls...",
			"Everytime you make a weigth you discover some information about the balls and the balls are placed in the right boxes,...",
			"Remenber you can deduce information not only from the balls on the balance but also from the ones that you leave outside...",
			"The game places the balls on the correct group for you but you should deduce the outcome in your mind...",
			"Always think carefully for every weigth you do, try and fail will not help much...",
			"Thats it, hope you make it to next level...",
		],
		"4": ["Yep no more tips, you are on your own now :D..."],
		"5": ["Wow you are at the last practice level, you must be a master at this..."],
		"6": ["This is the level that counts, optimal result is 3 weights, good luck!!"
		
		]
	};

	function setTut () {
		var level = localStorage["current_level"];
		if (tutorials[level]) {
			var t = tutorials[level];
			$scope.tutorial = {index: 0, tut: t};
		}
	};

	$scope.tut_next = function () {
		$scope.tutorial.index++;
	};

	$scope.tut_back = function () {
		$scope.tutorial.index--;
	};

	$scope.restart = function () {
		var level = localStorage["current_level"] || 1;
		level = parseInt(level);
		
		$scope.game = {
			balls: {
				"heavier": levels[level]["heavier"],
				"lighter": levels[level]["lighter"],
				"equal"  : levels[level]["equal"],
				"unknown": levels[level]["unknown"]
			},
			weight: {
				total: 0,
				balls: {
					out: {},
					plates: {
						a: {},
						b: {}
					}
				},
				result: null
			},
			level: level
		};

		localStorage["level_" + level] = JSON.stringify($scope.game);
	};
	
	$scope.load = function () {
		var level = localStorage["current_level"];
		level = parseInt(level);
		
		setTut();


		try {
			$scope.game = JSON.parse(localStorage["level_"+level]); 
		} catch (err) {
			$scope.restart();
		}
	};
	
	$scope.load();
	
	$scope.count = function (plate) {
		var c = 0;
		for (var i in plate) {
			c += plate[i];
		}
		return c;
	};
	
	$scope.dragend = function (e, attrs) {
		var type = attrs['ballType'];
		if (ball) {
			document.body.removeChild(ball);

			var box_a = document.querySelector('#plate_a').getBoundingClientRect();
			var box_b = document.querySelector('#plate_b').getBoundingClientRect();
			
			var x = e.gesture.touches[0].pageX-24;
			var y = e.gesture.touches[0].pageY-24;
		
			if (y >= box_a.top && y <= box_a.bottom	&& x >= box_a.left && x <= box_a.right) {
				var c = $scope.count($scope.game.weight.balls.plates.a);

				if (c < 6) {
					$scope.game.weight.balls.plates.a[type] = $scope.game.weight.balls.plates.a[type] || 0;
					$scope.game.weight.balls.plates.a[type]++;
				}
				else {
					$scope.game.balls[type]++;
					$scope.error("You cant add more than 6 balls on a plate!");
				}
			}
			else if (y >= box_b.top && y <= box_b.bottom	&& x >= box_b.left && x <= box_b.right) {
				var c = $scope.count($scope.game.weight.balls.plates.b);
				
				if (c < 6) {
					$scope.game.weight.balls.plates.b[type] = $scope.game.weight.balls.plates.b[type] || 0;
					$scope.game.weight.balls.plates.b[type]++;
				}
				else {
					$scope.game.balls[type]++;
					$scope.error("You cant add more than 6 balls on a plate!");
				}
			}
			else {
				$scope.game.balls[type]++;
			}
			
			ball = undefined;
			$scope.$apply();
		}
	};


	$scope.drag = function (e, attrs) {
		if (ball) {
			ball.style.left = (e.gesture.touches[0].pageX-24)+ "px";
			ball.style.top = (e.gesture.touches[0].pageY-24)+ "px";
		}
	};
	
	$scope.dragstart = function (e, attrs) {
		$scope.error("");
		
		var type = attrs['ballType'];
		if ($scope.game.balls[type] > 0) {
			$scope.game.balls[type]--;
			ball = document.createElement("div");
			ball.className = "ball_drag ball_"+type;
			ball.style.position = "absolute";
			ball.style.left = (e.gesture.touches[0].pageX-24)+ "px";
			ball.style.top = (e.gesture.touches[0].pageY-24)+ "px";
			ball.style.zIndex = "1000";
			ball.style.display = "block";
			
			document.body.appendChild(ball);
		}
		else {
			ball = undefined;
			$scope.error("No Balls to move!");
		}
		$scope.$apply();
	};

	$scope.removeBall = function (type, plate) {
		if (plate === 'A') {
			$scope.game.weight.balls.plates.a[type]--;
		}
		else {
			$scope.game.weight.balls.plates.b[type]--;
		}
		$scope.game.balls[type]++;
	};

	function w () {
		var out = $scope.game.balls["heavier"]
		          + $scope.game.balls["lighter"]
		          + $scope.game.balls["equal"]
		          + $scope.game.balls["unknown"];
		          
		var plate_a = $scope.game.weight.balls.plates.a;
		var plate_b = $scope.game.weight.balls.plates.b;
		
		pa = {
			"heavier": plate_a["heavier"] || 0,
			"lighter": plate_a["lighter"] || 0,
			"equal"  : plate_a["equal"]   || 0,
			"unknown": plate_a["unknown"] || 0
		};       
		      
		pb = {
			"heavier": plate_b["heavier"] || 0,
			"lighter": plate_b["lighter"] || 0,
			"equal"  : plate_b["equal"]   || 0,
			"unknown": plate_b["unknown"] || 0
		};
		    
		var cases = [
			{
				balls: {
					"heavier": $scope.game.balls["heavier"],
					"lighter": $scope.game.balls["lighter"],
					"equal"  : $scope.game.balls["equal"] + $scope.count(plate_a) + $scope.count(plate_b),
					"unknown": $scope.game.balls["unknown"]
				},
				type_a: "equal",
				type_b: "equal"
			},
			{
				balls: {
					"heavier": pa["heavier"] + pa["unknown"],
					"lighter": pb["unknown"] + pb["lighter"],
					"equal"  : out + pa["lighter"] + pa["equal"] + pb["equal"] + pb["heavier"],
					"unknown": 0
				},
				type_a: "heavier",
				type_b: "lighter"
			},
			{
				balls: {
					"heavier": pb["heavier"] + pb["unknown"],
					"lighter": pa["unknown"] + pa["lighter"],
					"equal"  : out + pb["lighter"] + pb["equal"] + pa["equal"] + pa["heavier"],
					"unknown": 0
				},
				type_a: "lighter",
				type_b: "heavier"
			}
		];

		// remove invalid;
		r = [];
		cases.forEach (function (e, i) {
			if (e.balls["equal"] < 12) {
				r.push(e);
			}
		});

		r.sort(function(a, b) {
			return a["balls"]["equal"] - b["balls"]["equal"];
		});

		return r;
	}

	$ionicModal.fromTemplateUrl('templates/win.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});
	
	$scope.goLevel = function(level) {
		$scope.modal.hide();
		$scope.setLevel(level);
		$scope.load();
		showPub();
		/*if ($window.pgadbuddiz) {
			$window.pgadbuddiz.showAd($scope.load, $scope.load);
		}
		else {
			$scope.load();
		}*/
		// $scope.$apply();
	};

	$scope.weight = function () {
		var c_a = $scope.count($scope.game.weight.balls.plates.a);
		var c_b = $scope.count($scope.game.weight.balls.plates.b);
		
		if (c_a !== c_b) {
			$scope.error("Amount of balls must be the same for both plates!");
		}
		else if (c_a === 0) {
			$scope.error("Plates cant be empty!");
		}
		else {
			var r = w();
			var d = 0;
			
			if (d >= r.length) {
				d = r.length-1;
			}

			$scope.game.weight.result = r[d];

			localStorage["level_" + $scope.game.level] = JSON.stringify($scope.game);			
		}
	};

	$scope.apply_weight = function () {
		$scope.game.balls = $scope.game.weight.result.balls;
		
		$scope.game.weight.total++;
		$scope.game.weight.balls = {
			out: {},
			plates: {
				a: {},
				b: {}
			}
		};
		$scope.game.weight.result = null;
		
		if (($scope.game.balls["equal"] === 11) && ($scope.game.balls["unknown"] === 0)) {
			$scope.score($scope.game.level, $scope.game.weight.total);
			$scope.game_show = $scope.game;
			$scope.game_show.weights = $scope.game.weight.total;
			$scope.restart();   
				
			$scope.modal.show();
		}
		else {
			$scope.plate_a = {};
			$scope.plate_b = {};

		}

		localStorage["level_" + $scope.game.level] = JSON.stringify($scope.game);			
	};

	$scope.cancel_weight = function () {
		var g  = $scope.game.balls;
		
		var plate_a = $scope.game.weight.balls.plates.a;
		var plate_b = $scope.game.weight.balls.plates.b;
		
		pa = {
			"heavier": plate_a["heavier"] || 0,
			"lighter": plate_a["lighter"] || 0,
			"equal"  : plate_a["equal"]   || 0,
			"unknown": plate_a["unknown"] || 0
		};       
		      
		pb = {
			"heavier": plate_b["heavier"] || 0,
			"lighter": plate_b["lighter"] || 0,
			"equal"  : plate_b["equal"]   || 0,
			"unknown": plate_b["unknown"] || 0
		};
		
		var level = $scope.game.level;
		$scope.game = {
			balls: {
				heavier: pa["heavier"] + pb["heavier"] + g["heavier"],
				lighter: pa["lighter"] + pb["lighter"] + g["lighter"],
				equal  : pa["equal"]   + pb["equal"]   + g["equal"],
				unknown: pa["unknown"] + pb["unknown"] + g["unknown"]
			},
			weight: {
				total: $scope.game.weight.total,
				balls : {
					out: {},
					plates: {
						a: {},
						b: {}
					}
				},
				result: null
			},
			level: level
		};
	};
	
	function showPub () {
		if ($scope.system.cordova) {
			$http({method: 'GET', url: 'https://admin.appnext.com/offerWallApi.aspx?id=aa2f85aa-65e4-46aa-a4ce-ad9b35d78ece&cnt=1&type=json&cat=Board,Puzzle,Action,Adventure,Arcade'})
				.success(function(data, status, headers, config) {
				  $scope.pub = data.apps[0];
				  console.log($scope.pub);
				  
/*				  $ionicModal.fromTemplateUrl('templates/win.html', {
		scope: $scope,
	}).then(function(modal) {
		$scope.modal = modal;
	});*/
				 var pub = $ionicPopup.show({
					templateUrl: 'templates/popup_pub.html',
					title: $scope.pub.title,
					subTitle: $scope.pub.categories,
					scope: $scope,
					buttons: [
						{ text: 'Close' },
						{
							text: '<b>Install</b>',
							type: 'button-positive',
							onTap: function(e) {
								$scope.open($scope.pub.urlApp);
							}
						},
					]
				  });
				  
				  $scope.openPub = function () {
					 $scope.open($scope.pub.urlApp);
					 pub.close();
				  };
				})
				.error(function(data, status, headers, config) {
				  console.log("error");
				});
	    }
   }
   
	

}])
/*
.controller('PubCtrl', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
	function get_ad () {
		$http({method: 'GET', url: 'https://admin.appnext.com/offerWallApi.aspx?id=aa2f85aa-65e4-46aa-a4ce-ad9b35d78ece&cnt=1&type=json&cat=Board,Puzzle,Action,Adventure,Arcade'})
			.success(function(data, status, headers, config) {
			  $scope.data = data;
			})
			.error(function(data, status, headers, config) {
			  console.log("error");
			});
	};
	
	$scope.open = function (urlApp) {
		window.open(urlApp,'_system','location=yes');
		return false;
	};	
	
	get_ad();
	
	var stop = $interval(get_ad, 1000*30);

	$scope.$on('$destroy', function() {
		if (angular.isDefined(stop)) {
			$interval.cancel(stop);
			stop = undefined;
		}
    });

}])
*/
;

