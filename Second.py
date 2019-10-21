import random
import math
import os


def poisson_generator(rate):
    L = math.exp(-1 * rate)
    k = 0
    p = 1
    while (p > L):
        k += 1
        rand = random.random()
        p *= rand
    return k - 1


def inter_arrival_time(rate):
    arrival = random.expovariate(rate)
    if (arrival > 1):
        return inter_arrival_time(rate)
    return arrival


event_space = [
    {
        'name': 'Customer 1 arrives',
        'rate': 3,
        'payment_per_ride': 0,  # pays a fixed fee
        'penalty': 1,
        'fixedFee': 0.5
    },
    {
        'name': 'Customer 2 arrives',
        'rate': 1,
        'payment_per_ride': 0,  # pays a fixed fee
        'penalty': 0.25,
        'fixedFee': 1
    },
    {
        'name': 'Customer 3 arrives',
        'rate': 4,
        'payment_per_ride': 1.25,
        'penalty': 0  # no penalty if Customer 3 does not find a Citibike
    },
    {
        'name': 'Bike returned',
        'rate': 6
    }
]


def run_simulation(simulation_round):
    file_name = f'csv_output/DES_Retro-Simulation#{simulation_round}.csv'
    if (os.path.exists(file_name)):
        os.remove(file_name)

    csv_file = open(file_name, 'a')

    col_headers = 'TimeRemaining,Event,BicyclesTaken,BikeRemaining,CurrentProfit'

    total_time = 120
    lambda_sum = 14
    amount_in_hand = (event_space[0]['fixedFee'] * event_space[0]['rate'] +
                      event_space[1]['fixedFee'] * event_space[1]['rate']) * total_time
    current_num_of_bicycles = 10

    first_column = f'{total_time},N/A,N/A,{current_num_of_bicycles},{amount_in_hand}'

    csv_file.write(f'{col_headers}\n{first_column}')
    event_arrivals = []

    for i in range(len(event_space)):
        for c in range(total_time):
            inter_arrival = inter_arrival_time(lambda_sum)
            event_arrivals += [(i + 1, c + inter_arrival)]

    sorted_arrivals = sorted(event_arrivals, key=lambda i: i[1], reverse=True)

    for event in sorted_arrivals:
        event_idx = event[0] - 1
        event_detail = event_space[event_idx]
        time_till_end = event[1]
        event_name = event_detail['name']
        bicycles_transacted = poisson_generator(event_detail['rate'])
        if (event_idx == 3):
            current_num_of_bicycles += bicycles_transacted
            csv_file.write(
                f'\n{time_till_end},{event_name},-{bicycles_transacted},{current_num_of_bicycles},{amount_in_hand}')
        else:
            fixed_fee_member = event_idx == 0 or event_idx == 1
            if (current_num_of_bicycles < bicycles_transacted):
                short_fall = bicycles_transacted - current_num_of_bicycles
                if (fixed_fee_member):
                    amount_in_hand -= short_fall * event_detail['penalty']
                bicycles_transacted -= short_fall
            current_num_of_bicycles -= bicycles_transacted

            if (event_idx == 2):
                amount_in_hand += event_detail['payment_per_ride'] * \
                    bicycles_transacted

            csv_file.write(
                f'\n{time_till_end},{event_name},{bicycles_transacted},{current_num_of_bicycles},{amount_in_hand}')


for i in range(1, 6):
    run_simulation(i)
