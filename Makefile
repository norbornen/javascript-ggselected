ci:
	borschik -i gg.selection.js -o gg.selection.min.js -c no
	git status
	git pull
	git add .
	git ci -m '.' -a
	git push
