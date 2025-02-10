class SetBoosterContentWeightsModel {
  final int? boosterIndex;
  final String? boosterName;
  final int? boosterWeight;
  final String? setCode;

  SetBoosterContentWeightsModel({
    this.boosterIndex,
    this.boosterName,
    this.boosterWeight,
    this.setCode,
  });

  factory SetBoosterContentWeightsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterContentWeightsModel(
      boosterIndex: map['boosterIndex'] as int?,
      boosterName: map['boosterName'] as String?,
      boosterWeight: map['boosterWeight'] as int?,
      setCode: map['setCode'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterIndex': boosterIndex,
      'boosterName': boosterName,
      'boosterWeight': boosterWeight,
      'setCode': setCode,
    };
  }
}