
with open('frontend/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract the header and footer parts
# We want up to line 4656 (the const S block)
# And the very end from 5777 onwards
header = lines[:4656]
footer = lines[5776:]

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.writelines(header)
    f.write('  <script src="app.js"></script>\n')
    f.writelines(footer)
