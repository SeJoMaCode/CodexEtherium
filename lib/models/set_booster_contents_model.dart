class SetBoosterContentsModel {
  final int? boosterIndex;
  final String? boosterName;
  final String? setCode;
  final String? sheetName;
  final int? sheetPicks;

  SetBoosterContentsModel({
    this.boosterIndex,
    this.boosterName,
    this.setCode,
    this.sheetName,
    this.sheetPicks,
  });

  factory SetBoosterContentsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterContentsModel(
      boosterIndex: map['boosterIndex'] as int?,
      boosterName: map['boosterName'] as String?,
      setCode: map['setCode'] as String?,
      sheetName: map['sheetName'] as String?,
      sheetPicks: map['sheetPicks'] as int?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterIndex': boosterIndex,
      'boosterName': boosterName,
      'setCode': setCode,
      'sheetName': sheetName,
      'sheetPicks': sheetPicks,
    };
  }
}