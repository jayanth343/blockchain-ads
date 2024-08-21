import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib  # For saving and loading models

# Load the training and testing datasets
train_data = pd.read_csv('/home/ishaan/Downloads/archive/hai-20.07/train2.csv', sep=';') #Fill in your individual file path here
test_data = pd.read_csv('/home/ishaan/Downloads/archive/hai-20.07/test2.csv', sep=';')

# Define feature sets for each group
feature_groups = {
    'P1': [
        'P1_B2004', 'P1_B2016', 'P1_B3004', 'P1_B3005', 'P1_B4002', 'P1_B4005', 'P1_B400B', 'P1_B4022',
        'P1_FCV01D', 'P1_FCV01Z', 'P1_FCV02D', 'P1_FCV02Z', 'P1_FCV03D', 'P1_FCV03Z', 'P1_FT01', 'P1_FT01Z',
        'P1_FT02', 'P1_FT02Z', 'P1_FT03', 'P1_FT03Z', 'P1_LCV01D', 'P1_LCV01Z', 'P1_LIT01', 'P1_PCV01D',
        'P1_PCV01Z', 'P1_PCV02D', 'P1_PCV02Z', 'P1_PIT01', 'P1_PIT02', 'P1_PP01AD', 'P1_PP01AR', 'P1_PP01BD',
        'P1_PP01BR', 'P1_PP02D', 'P1_PP02R', 'P1_STSP', 'P1_TIT01', 'P1_TIT02'
    ],
    'P2': [
        'P2_24Vdc', 'P2_ASD', 'P2_AutoGO', 'P2_CO_rpm', 'P2_Emerg', 'P2_HILout', 'P2_MSD', 'P2_ManualGO',
        'P2_OnOff', 'P2_RTR', 'P2_SIT01', 'P2_SIT02', 'P2_TripEx', 'P2_VT01', 'P2_VTR01', 'P2_VTR02', 'P2_VTR03',
        'P2_VTR04', 'P2_VXT02', 'P2_VXT03', 'P2_VYT02', 'P2_VYT03'
    ],
    'P3': ['P3_FIT01', 'P3_LCP01D', 'P3_LCV01D', 'P3_LH', 'P3_LIT01', 'P3_LL', 'P3_PIT01'],
    'P4': ['P4_HT_FD', 'P4_HT_LD', 'P4_HT_PO', 'P4_HT_PS', 'P4_LD', 'P4_ST_FD', 'P4_ST_GOV', 'P4_ST_LD', 'P4_ST_PO', 'P4_ST_PS', 'P4_ST_PT01', 'P4_ST_TT01']
}

# Function to train and evaluate SVM model
def train_and_evaluate_svm(X_train, y_train, X_test, y_test, feature_group_name):
    # Preprocess the data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train the SVM model
    svm_model = SVC(kernel='rbf', C=1.0, gamma='scale')
    svm_model.fit(X_train_scaled, y_train)

    # Save the model and scaler for later use
    joblib.dump(svm_model, f'{feature_group_name}_svm_model.pkl')
    joblib.dump(scaler, f'{feature_group_name}_scaler.pkl')

    # Make predictions on the test set
    y_pred = svm_model.predict(X_test_scaled)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Evaluation for feature group: {feature_group_name}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))  # Adjust zero_division as needed
    print(f"Accuracy: {accuracy}\n")
    print("\n" + "="*60 + "\n")

    return accuracy

# Remove rows with NaN values in the target variable
train_data = train_data.dropna(subset=['attack'])
test_data = test_data.dropna(subset=['attack'])

# Store accuracies for plotting
accuracies = []

# Loop through each feature group and train/evaluate SVM models
for group_name, features in feature_groups.items():
    # Check for missing columns
    missing_features_train = [feature for feature in features if feature not in train_data.columns]
    missing_features_test = [feature for feature in features if feature not in test_data.columns]
    if missing_features_train:
        print(f"Warning: The following features are missing from the training dataset for group {group_name}: {missing_features_train}")
    if missing_features_test:
        print(f"Warning: The following features are missing from the testing dataset for group {group_name}: {missing_features_test}")

    # Remove missing features from the list
    available_features_train = [feature for feature in features if feature in train_data.columns]
    available_features_test = [feature for feature in features if feature in test_data.columns]

    # Ensure that both training and testing data have the same set of features
    available_features = list(set(available_features_train) & set(available_features_test))

    # Select the available features
    if available_features:  # Ensure there are features to process
        X_train = train_data[available_features].dropna()
        y_train = train_data.loc[X_train.index, 'attack']

        X_test = test_data[available_features].dropna()
        y_test = test_data.loc[X_test.index, 'attack']

        # Check if both training and testing sets contain more than one class
        if len(y_train.unique()) > 1 and len(y_test.unique()) > 1:
            accuracy = train_and_evaluate_svm(X_train, y_train, X_test, y_test, group_name)
            accuracies.append((group_name, accuracy))
        else:
            print(f"Skipping feature group {group_name} due to insufficient class diversity in the target variable.")

# Plot the accuracies
if accuracies:
    feature_group_names, accuracy_values = zip(*accuracies)
    plt.figure(figsize=(10, 5))
    plt.plot(feature_group_names, accuracy_values, marker='o')
    plt.title('SVM Model Accuracy by Feature Group')
    plt.xlabel('Feature Group')
    plt.ylabel('Accuracy')
    plt.grid(True)
    plt.show()

# Function to predict if given data is an anomaly
def predict_anomaly(feature_group_name, input_data):
    # Load the saved model and scaler
    svm_model = joblib.load(f'{feature_group_name}_svm_model.pkl')
    scaler = joblib.load(f'{feature_group_name}_scaler.pkl')

    # Preprocess the input data
    input_data_scaled = scaler.transform([input_data])

    # Make a prediction
    prediction = svm_model.predict(input_data_scaled)

    if prediction == 1:
        print("The input data is predicted as an anomaly.")
    else:
        print("The input data is predicted as normal.")

# Example usage of predict_anomaly function
# Replace with actual feature group name and input data
feature_group_name = 'P1'
input_data = [0.1001,1.2299,395.3508,1120.8154,29.4139,0,34.9568,32.7132,0,0.2609,100,96.4142,58.7788,59.8541,179.5197,845.6955,6.9046,35.9501,317.6117,1122.0468,15.5131,15.2298,397.7,99.3488,101.297,12,12.2238,1.317,0.2084,34.7351,36.0779]  # Example input data
predict_anomaly(feature_group_name, input_data)
