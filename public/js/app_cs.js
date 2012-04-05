
$(document).ready(function() {
	
	var $report = $("div#report table"),
		$total 		= $("td:eq(0) span",$report),
		$success	= $("td:eq(1) span",$report),
		$duplicate 	= $("td:eq(2) span",$report),
		$error 		= $("td:eq(3) span",$report); 
	
	var totalLinks = parseInt($total.text());
	
	var $defLabel = $("<span />").addClass('label'),
		statusLabels = [
			$defLabel.clone().text("Success"),
			$defLabel.clone().addClass('label-warning').text("Duplicate"),
			$defLabel.clone().addClass('label-error').text("Error!")
		];
	
	var postLink = function(url,$el) {
		return $.get('/add/' + encodeURIComponent(url),{dataType: 'json'})
			.done(function(data) {
				var $replacement;
				
				switch(data.result) {
					case 0:
						$replacement = statusLabels[1];
						$duplicate.text(
							(parseInt($duplicate.text()) + 1)
						);
						break;
					case 1:
						$replacement = statusLabels[0];
						$success.text(
							(parseInt($success.text()) + 1)
						);
						break;
					default:
						$error.text(
							(parseInt($error.text()) + 1)
						);
						$replacement = statusLabels[2];
						break;
				}
				
				$total.text( (parseInt($total.text())-1) );
				$("td:eq(0) span",$el).fadeOut('fast',function() {
					$old = $(this);
					$old
						.parent()
							.append($replacement.clone().fadeIn('fast'),function() { $old.remove(); });
				});
			});
	};
	
	$("input#import").click(function() {
		var queue = [];
		$(this).attr('disabled','disabled');
		$("div#loading").fadeIn('fast');
		
		$("div#linkTable tr").not(":eq(0)").each(function(){
			var $tr = $(this);
			var id = parseInt($tr.attr('id').slice(4));
			queue.push(	postLink($("a",$tr).attr('href'),$tr) );
		});
		
		$.when.apply(null,queue).done(function(){
			$("div#loading").slideUp();
			$("div#done").slideDown();
			$("input#import").hide();
		});
		
	});
});
