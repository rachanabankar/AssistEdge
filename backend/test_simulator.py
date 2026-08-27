import sys
from agents.simulator import generate_customer_message

scenario = "Customer upset about a delayed shipment"
persona = {"tone": "frustrated but polite", "patience": "low"}


def run_test_1():
    """Opening message, empty history."""
    history = []
    message = generate_customer_message(scenario, persona, history)
    print("CUSTOMER:", message)


def run_test_2():
    """Reply after GOOD agent handling — tone should plateau/ease."""
    history = [
        {"sender": "customer", "content": "My order is 3 days late and tracking hasn't updated."},
        {"sender": "agent", "content": "I'm sorry about that! I checked and your package is stuck at the local sorting facility. It should move in the next 24 hours."},
    ]
    message = generate_customer_message(scenario, persona, history)
    print("CUSTOMER (after good handling):", message)


def run_test_3():
    """Reply after BAD agent handling — tone should escalate."""
    history = [
        {"sender": "customer", "content": "My order is 3 days late and tracking hasn't updated."},
        {"sender": "agent", "content": "There's nothing I can do, you'll just have to wait."},
    ]
    message = generate_customer_message(scenario, persona, history)
    print("CUSTOMER (after bad handling):", message)


TESTS = {
    "1": run_test_1,
    "2": run_test_2,
    "3": run_test_3,
}


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in TESTS:
        print("Usage: python test_simulator.py [1|2|3]")
        sys.exit(1)

    TESTS[sys.argv[1]]()