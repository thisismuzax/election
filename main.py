sum = 0
stavka = 1.08

num = int(input())

for i in range(22):
    sum += (num * stavka) + num

print(sum)
