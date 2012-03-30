
$(document).ready(function() {
	
	var postLink = function(url,$el) {
		return $.get('/add/' + encodeURIComponent(url),{dataType: 'json'})
			.done(function(data) {
				var bgColor = (data.result === 1) ? "green" :
					(data.result === 0) ? "yellow" : "red";
				$el.css('background-color',bgColor);
			});
	};
	
	$("input#import").click(function() {
		var queue = [];
		$(this).attr('disabled','disabled');
		$("div#loading").toggle();
		$("li").each(function(){
			var $li = $(this);
			var id = parseInt($li.attr('id').slice(4));
			queue.push(	postLink($("a",$li).attr('href'),$li) );
		});
		
		$.when.apply(null,queue).done(function(){
			$("div#loading").slideUp();
			$("div#done").slideDown();
			$("input#import").hide();
		});
	});
});
